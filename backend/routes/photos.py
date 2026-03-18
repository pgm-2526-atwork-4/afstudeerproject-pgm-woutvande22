import logging
import uuid
import json
import re
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Body
from pydantic import BaseModel
from typing import Optional
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/photos", tags=["Photos"])

BUCKET_NAME = "photos"
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 10
LEGACY_GRAY_TAG_COLOR = "#6B7280"

# Schemas

class PhotoResponse(BaseModel):
    id: int
    url: str
    user_id: str
    file_size_mb: float
    order_id: Optional[int] = 0
    title: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[str] = None

class PhotoListResponse(BaseModel):
    photos: list[PhotoResponse]
    count: int
    total_count: Optional[int] = None
    next_offset: Optional[int] = None
    has_more: bool = False

class ReorderItem(BaseModel):
    id: int
    order_id: int

class ReorderRequest(BaseModel):
    photos: list[ReorderItem]

class UpdatePhotoRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


def _normalize_tag_name(value: str) -> str:
    """Normalize tag names to kebab-case."""
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    normalized = re.sub(r"-+", "-", normalized).strip("-")
    return normalized


def _normalize_color_hex(value: str | None) -> str | None:
    """Normalize tag color to #RRGGBB when valid."""
    if not value:
        return None

    raw = str(value).strip().lower()
    if re.fullmatch(r"#[0-9a-f]{6}", raw):
        return raw.upper()
    if re.fullmatch(r"#[0-9a-f]{3}", raw):
        return ("#" + "".join(ch * 2 for ch in raw[1:])).upper()
    return None


def _fallback_color_for_tag(tag_name: str) -> str:
    """Generate a deterministic non-gray color for a tag name."""
    palette = [
        "#0EA5E9",
        "#22C55E",
        "#F97316",
        "#8B5CF6",
        "#EC4899",
        "#EAB308",
        "#14B8A6",
        "#F43F5E",
        "#84CC16",
        "#06B6D4",
        "#3B82F6",
        "#A855F7",
    ]
    digest = hashlib.sha256(tag_name.encode("utf-8")).hexdigest()
    return palette[int(digest[:8], 16) % len(palette)]


def _get_current_user(supabase, access_token: str):
    """Authenticate the user and apply the auth token to the PostgREST client."""
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.postgrest.auth(access_token)
    return user



def _reserve_storage(supabase, user_id: str, file_size_mb: float) -> None:
    """Reserve storage atomically via the database RPC before upload starts."""
    try:
        result = supabase.rpc(
            "reserve_storage",
            {"p_user_id": user_id, "p_size_mb": file_size_mb},
        ).execute()
    except Exception as e:
        logger.error(f"Failed to reserve storage for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reserve storage")

    reserved = result.data
    if isinstance(reserved, list):
        reserved = reserved[0] if reserved else False

    if not reserved:
        raise HTTPException(
            status_code=409,
            detail="Storage limit exceeded. Upgrade your plan for more space.",
        )



def _release_storage(supabase, user_id: str, file_size_mb: float) -> None:
    """Release previously reserved storage when a later upload step fails."""
    try:
        supabase.rpc(
            "release_storage",
            {"p_user_id": user_id, "p_size_mb": file_size_mb},
        ).execute()
    except Exception as e:
        logger.error(f"Failed to release storage for user {user_id}: {e}")


# upload

@router.post("/upload", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    access_token: str = Query(...),
    collection_id: Optional[int] = Query(None),
    title: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    tag_names: Optional[str] = Query(None, description="JSON array of tag names, e.g. '[\"landscape\",\"sunset\"]'"),
    tag_items: Optional[str] = Query(None, description="JSON array of tag objects, e.g. '[{\"name\":\"landscape\",\"color_hex\":\"#22C55E\"}]'"),
    file: UploadFile = File(...),
):
    """Upload a photo to Supabase Storage and create a record in the photos table."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # 1. Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use: {', '.join(ALLOWED_TYPES)}"
        )

    # 2. Read file content and check size
    content = await file.read()
    file_size_mb = round(len(content) / (1024 * 1024), 2)

    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb} MB). Max is {MAX_FILE_SIZE_MB} MB."
        )

    # 3. Reserve storage atomically before uploading the file
    _reserve_storage(supabase, user.id, file_size_mb)

    # 4. Upload to Supabase Storage
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    storage_path = f"{user.id}/{uuid.uuid4()}.{file_ext}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type},
        )
    except Exception as e:
        _release_storage(supabase, user.id, file_size_mb)
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    # 5. Get the public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)

    # 6. Insert record into photos table
    # Get the next order_id for this user
    try:
        last_photo = (
            supabase.table("photos")
            .select("order_id")
            .eq("user_id", user.id)
            .order("order_id", desc=True)
            .limit(1)
            .execute()
        )
        next_order = (last_photo.data[0]["order_id"] + 1) if last_photo.data else 0
    except Exception:
        next_order = 0

    try:
        photo_record = (
            supabase.table("photos")
            .insert({
                "url": public_url,
                "user_id": user.id,
                "file_size_mb": file_size_mb,
                "order_id": next_order,
                "title": title,
                "description": description,
            })
            .execute()
        )
    except Exception as e:
        try:
            supabase.storage.from_(BUCKET_NAME).remove([storage_path])
        except Exception as cleanup_error:
            logger.error(f"Failed to clean up uploaded file after DB error: {cleanup_error}")
        _release_storage(supabase, user.id, file_size_mb)
        logger.error(f"Failed to create photo record: {e}")
        raise HTTPException(status_code=500, detail="Failed to save photo record")

    photo = photo_record.data[0]

    # 7. If collection_id provided, link photo to collection
    if collection_id:
        try:
            # Get the next order_id for this collection
            existing = (
                supabase.table("collections_to_photos")
                .select("order_id")
                .eq("collection_id", collection_id)
                .order("order_id", desc=True)
                .limit(1)
                .execute()
            )
            next_order = (existing.data[0]["order_id"] + 1) if existing.data else 0

            supabase.table("collections_to_photos").insert({
                "collection_id": collection_id,
                "photo_id": photo["id"],
                "order_id": next_order,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to link photo to collection: {e}")

    # 10. If tags provided, find-or-create tags and link them to the photo
    if tag_items or tag_names:
        try:
            parsed_items = json.loads(tag_items) if tag_items else None
            parsed_names = json.loads(tag_names) if tag_names else None

            normalized_tags: dict[str, str] = {}

            if isinstance(parsed_items, list):
                for raw_item in parsed_items:
                    if isinstance(raw_item, dict):
                        name = _normalize_tag_name(str(raw_item.get("name") or ""))
                        color = _normalize_color_hex(str(raw_item.get("color_hex") or ""))
                    else:
                        name = _normalize_tag_name(str(raw_item))
                        color = None

                    if name:
                        color = color or _fallback_color_for_tag(name)

                    if name and name not in normalized_tags:
                        normalized_tags[name] = color

            if isinstance(parsed_names, list):
                for raw_name in parsed_names:
                    name = _normalize_tag_name(str(raw_name))
                    if name and name not in normalized_tags:
                        normalized_tags[name] = _fallback_color_for_tag(name)

            if normalized_tags:
                # Set auth header for RLS
                supabase.postgrest.auth(access_token)

                for name, color_hex in normalized_tags.items():
                    # Find existing tag for this user
                    existing_tag = safe_maybe_single(
                        supabase.table("tags")
                        .select("id, color_hex")
                        .eq("name", name)
                        .eq("user_id", user.id)
                    )

                    if existing_tag.data:
                        existing_row = existing_tag.data if isinstance(existing_tag.data, dict) else existing_tag.data[0]
                        tag_id = existing_row["id"]
                        existing_color = _normalize_color_hex(str(existing_row.get("color_hex") or ""))

                        # Upgrade old gray defaults when a better AI color is now available.
                        if existing_color == LEGACY_GRAY_TAG_COLOR and color_hex != LEGACY_GRAY_TAG_COLOR:
                            try:
                                supabase.table("tags").update({"color_hex": color_hex}).eq("id", tag_id).eq("user_id", user.id).execute()
                            except Exception as e:
                                logger.warning(f"Failed to update legacy gray color for tag {tag_id}: {e}")
                    else:
                        try:
                            new_tag = (
                                supabase.table("tags")
                                .insert({"name": name, "color_hex": color_hex, "user_id": user.id})
                                .execute()
                            )
                            tag_id = new_tag.data[0]["id"]
                        except Exception as e:
                            # A same-user duplicate can occur under concurrency.
                            if getattr(e, "code", None) == "23505" or "23505" in str(e):
                                existing_after_conflict = safe_maybe_single(
                                    supabase.table("tags")
                                    .select("id")
                                    .eq("name", name)
                                    .eq("user_id", user.id)
                                )
                                if not existing_after_conflict.data:
                                    raise
                                tag_id = existing_after_conflict.data["id"] if isinstance(existing_after_conflict.data, dict) else existing_after_conflict.data[0]["id"]
                            else:
                                raise

                    # Link tag to photo (ignore if already linked)
                    try:
                        supabase.table("photos_to_tags").insert({
                            "photo_id": photo["id"],
                            "tag_id": tag_id,
                        }).execute()
                    except Exception as e:
                        logger.warning(
                            f"Failed to link tag {tag_id} to photo {photo['id']}: {e}"
                        )
        except json.JSONDecodeError:
            logger.warning(f"Invalid tag payload JSON (tag_items={tag_items}, tag_names={tag_names})")
        except Exception as e:
            logger.error(f"Failed to process tags during upload: {e}")

    return PhotoResponse(**photo)

# get all photos for user

@router.get("/", response_model=PhotoListResponse)
def get_my_photos(
    access_token: str = Query(...),
    limit: Optional[int] = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Return all photos belonging to the authenticated user."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        query = (
            supabase.table("photos")
            .select("*", count="exact")
            .eq("user_id", user.id)
            .order("order_id")
        )

        if limit is not None:
            query = query.range(offset, offset + limit - 1)

        result = query.execute()
    except Exception:
        # Fallback if order_id column doesn't exist yet
        query = (
            supabase.table("photos")
            .select("*", count="exact")
            .eq("user_id", user.id)
        )

        if limit is not None:
            query = query.range(offset, offset + limit - 1)

        result = query.execute()

    rows = result.data or []
    total_count = result.count if isinstance(result.count, int) else None

    if limit is None:
        return PhotoListResponse(
            photos=rows,
            count=len(rows),
            total_count=total_count,
            next_offset=None,
            has_more=False,
        )

    has_more = len(rows) == limit and (
        total_count is None or (offset + len(rows) < total_count)
    )
    next_offset = offset + len(rows) if has_more else None

    return PhotoListResponse(
        photos=rows,
        count=len(rows),
        total_count=total_count,
        next_offset=next_offset,
        has_more=has_more,
    )


# reorder photos

@router.put("/reorder")
def reorder_photos(access_token: str = Query(...), body: ReorderRequest = Body(...)):
    """Update the order_id of multiple photos at once."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    update_map = {item.id: item.order_id for item in body.photos}
    if not update_map:
        return {"message": "Order updated"}

    requested_ids = list(update_map.keys())

    try:
        existing = (
            supabase.table("photos")
            .select("id, order_id")
            .eq("user_id", user.id)
            .in_("id", requested_ids)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to fetch photos before reorder: {e}")
        raise HTTPException(status_code=500, detail="Failed to reorder photos")

    current_order_by_id = {
        row["id"]: int(row.get("order_id") or 0)
        for row in (existing.data or [])
    }

    updates_to_apply = [
        (photo_id, new_order)
        for photo_id, new_order in update_map.items()
        if photo_id in current_order_by_id and current_order_by_id[photo_id] != new_order
    ]

    if not updates_to_apply:
        return {"message": "Order updated"}

    def _update_one(photo_id: int, new_order: int) -> None:
        supabase.table("photos").update({"order_id": new_order}).eq("id", photo_id).eq("user_id", user.id).execute()

    failures: list[int] = []
    max_workers = min(8, len(updates_to_apply))

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(_update_one, photo_id, new_order): photo_id
            for photo_id, new_order in updates_to_apply
        }

        for future in as_completed(future_map):
            photo_id = future_map[future]
            try:
                future.result()
            except Exception as e:
                failures.append(photo_id)
                logger.error(f"Failed to update order for photo {photo_id}: {e}")

    if failures:
        logger.warning(f"Photo reorder partially failed for user {user.id}: {len(failures)} failures")

    return {"message": "Order updated"}

# get a single phoot

@router.get("/{photo_id}", response_model=PhotoResponse)
def get_photo(photo_id: int, access_token: str = Query(...)):
    """Return a single photo by ID (must belong to the authenticated user)."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = safe_maybe_single(
        supabase.table("photos")
        .select("*")
        .eq("id", photo_id)
        .eq("user_id", user.id)
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    return PhotoResponse(**result.data)

# Update photo

@router.patch("/{photo_id}", response_model=PhotoResponse)
def update_photo(photo_id: int, access_token: str = Query(...), body: UpdatePhotoRequest = Body(...)):
    """Update a photo's title."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check if photo exists and belongs to user
    existing = safe_maybe_single(
        supabase.table("photos")
        .select("*")
        .eq("id", photo_id)
        .eq("user_id", user.id)
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Build update dict with only provided fields
    update_data = {}
    if body.title is not None:
        update_data["title"] = body.title
    if body.description is not None:
        update_data["description"] = body.description

    if not update_data:
        return PhotoResponse(**existing.data)

    result = (
        supabase.table("photos")
        .update(update_data)
        .eq("id", photo_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update photo")

    return PhotoResponse(**result.data[0])

# Delete photo

@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: int, access_token: str = Query(...)):
    """Delete a photo and remove it from storage."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # Fetch the photo to get the URL for storage deletion
    result = safe_maybe_single(
        supabase.table("photos")
        .select("*")
        .eq("id", photo_id)
        .eq("user_id", user.id)
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo = result.data
    file_size_mb = float(photo.get("file_size_mb", 0) or 0)

    # Extract storage path from URL
    url: str = photo["url"]
    try:
        # URL format: .../storage/v1/object/public/photos/user_id/filename.ext
        storage_path = url.split(f"/{BUCKET_NAME}/")[1]
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
    except Exception as e:
        logger.error(f"Failed to delete file from storage: {e}")

    # Delete junction/related records that reference this photo.
    # moodboard_items must be cleaned too, otherwise FK constraints can block photo deletion.
    try:
        supabase.table("moodboard_items").delete().eq("photo_id", photo_id).execute()
        supabase.table("collections_to_photos").delete().eq("photo_id", photo_id).execute()
        supabase.table("photos_to_tags").delete().eq("photo_id", photo_id).execute()
    except Exception as e:
        logger.error(f"Failed to clean up junction records: {e}")

    # Delete the photo record
    supabase.table("photos").delete().eq("id", photo_id).execute()
    _release_storage(supabase, user.id, file_size_mb)

    return None