import logging
import uuid
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Body
from pydantic import BaseModel
from typing import Optional
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/photos", tags=["Photos"])

BUCKET_NAME = "photos"
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 10

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

class ReorderItem(BaseModel):
    id: int
    order_id: int

class ReorderRequest(BaseModel):
    photos: list[ReorderItem]

class UpdatePhotoRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# upload

@router.post("/upload", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    access_token: str = Query(...),
    collection_id: Optional[int] = Query(None),
    title: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    tag_names: Optional[str] = Query(None, description="JSON array of tag names, e.g. '[\"landscape\",\"sunset\"]'"),
    file: UploadFile = File(...),
):
    """Upload a photo to Supabase Storage and create a record in the photos table."""
    supabase = get_supabase()

    # 1. Authenticate the user
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 2. Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use: {', '.join(ALLOWED_TYPES)}"
        )

    # 3. Read file content and check size
    content = await file.read()
    file_size_mb = round(len(content) / (1024 * 1024), 2)

    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb} MB). Max is {MAX_FILE_SIZE_MB} MB."
        )

    # 4. Check user storage limit
    profile = safe_maybe_single(
        supabase.table("users")
        .select("current_storage_mb, subscription_id")
        .eq("id", user.id)
    )

    if profile.data:
        current_storage = profile.data.get("current_storage_mb", 0)
        sub_id = profile.data.get("subscription_id")

        # Get storage limit from subscriptions table
        if sub_id:
            sub = safe_maybe_single(
                supabase.table("subscriptions")
                .select("storage_limit_mb")
                .eq("id", sub_id)
            )
            limit = sub.data.get("storage_limit_mb", 10240) if sub.data else 10240
        else:
            limit = 10240  # default ~10 GB

        if current_storage + file_size_mb > limit:
            raise HTTPException(
                status_code=400,
                detail="Storage limit exceeded. Upgrade your plan for more space."
            )

    # 5. Upload to Supabase Storage
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    storage_path = f"{user.id}/{uuid.uuid4()}.{file_ext}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type},
        )
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    # 6. Get the public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)

    # 7. Insert record into photos table
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
        # Clean up the uploaded file if DB insert fails
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
        logger.error(f"Failed to create photo record: {e}")
        raise HTTPException(status_code=500, detail="Failed to save photo record")

    photo = photo_record.data[0]

    # 8. Update user storage
    try:
        supabase.table("users").update({
            "current_storage_mb": (profile.data.get("current_storage_mb", 0) + file_size_mb)
            if profile.data else file_size_mb
        }).eq("id", user.id).execute()
    except Exception as e:
        logger.error(f"Failed to update user storage: {e}")

    # 9. If collection_id provided, link photo to collection
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

    # 10. If tag_names provided, find-or-create tags and link them to the photo
    if tag_names:
        try:
            names = json.loads(tag_names)
            if isinstance(names, list):
                # Set auth header for RLS
                supabase.postgrest.auth(access_token)

                for raw_name in names:
                    name = str(raw_name).strip().lower()
                    if not name:
                        continue

                    # Find existing tag for this user
                    existing_tag = safe_maybe_single(
                        supabase.table("tags")
                        .select("id")
                        .eq("name", name)
                        .eq("user_id", user.id)
                    )

                    if existing_tag.data:
                        tag_id = existing_tag.data["id"] if isinstance(existing_tag.data, dict) else existing_tag.data[0]["id"]
                    else:
                        # Create the tag with a default color
                        new_tag = (
                            supabase.table("tags")
                            .insert({"name": name, "color_hex": "#6B7280", "user_id": user.id})
                            .execute()
                        )
                        tag_id = new_tag.data[0]["id"]

                    # Link tag to photo (ignore if already linked)
                    try:
                        supabase.table("photos_to_tags").insert({
                            "photo_id": photo["id"],
                            "tag_id": tag_id,
                        }).execute()
                    except Exception:
                        pass  # already linked
        except json.JSONDecodeError:
            logger.warning(f"Invalid tag_names JSON: {tag_names}")
        except Exception as e:
            logger.error(f"Failed to process tags during upload: {e}")

    return PhotoResponse(**photo)

# get all photos for user

@router.get("/", response_model=PhotoListResponse)
def get_my_photos(access_token: str = Query(...)):
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
        result = (
            supabase.table("photos")
            .select("*")
            .eq("user_id", user.id)
            .order("order_id")
            .execute()
        )
    except Exception:
        # Fallback if order_id column doesn't exist yet
        result = (
            supabase.table("photos")
            .select("*")
            .eq("user_id", user.id)
            .execute()
        )

    return PhotoListResponse(photos=result.data, count=len(result.data))


# reorder photos

@router.put("/reorder")
def reorder_photos(access_token: str = Query(...), body: ReorderRequest = Body(...)):
    """Update the order_id of multiple photos at once."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    for item in body.photos:
        try:
            supabase.table("photos").update({
                "order_id": item.order_id
            }).eq("id", item.id).eq("user_id", user.id).execute()
        except Exception as e:
            logger.error(f"Failed to update order for photo {item.id}: {e}")

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

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

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
    file_size_mb = photo.get("file_size_mb", 0)

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

    # Update user storage
    try:
        profile = safe_maybe_single(
            supabase.table("users")
            .select("current_storage_mb")
            .eq("id", user.id)
        )
        if profile.data:
            new_storage = max(0, profile.data.get("current_storage_mb", 0) - file_size_mb)
            supabase.table("users").update({
                "current_storage_mb": new_storage
            }).eq("id", user.id).execute()
    except Exception as e:
        logger.error(f"Failed to update user storage: {e}")

    return None