import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/collections", tags=["Collections"])


# ──────────────────────────── Schemas ────────────────────────────

class CollectionResponse(BaseModel):
    id: int
    title: str
    user_id: str
    order_id: int = 0
    image_count: int = 0
    pinned: bool = False
    cover_image_url: Optional[str] = None
    last_used_at: Optional[str] = None


class CollectionListResponse(BaseModel):
    collections: list[CollectionResponse]
    count: int


class CreateCollectionRequest(BaseModel):
    title: str


class UpdateCollectionRequest(BaseModel):
    title: Optional[str] = None


class CollectionPhotoRequest(BaseModel):
    photo_id: int


class ReorderCollectionItem(BaseModel):
    id: int
    order_id: int


class ReorderCollectionPhotosRequest(BaseModel):
    photos: list[ReorderCollectionItem]


class PhotoCollectionCountsRequest(BaseModel):
    photo_ids: list[int]


class PhotoCollectionCountsResponse(BaseModel):
    counts: dict[str, int]


# ──────────────────────────── Helpers ────────────────────────────

def _get_current_user(supabase, access_token: str):
    """Authenticate the user and return the user object."""
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail=str(e))

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.postgrest.auth(access_token)
    return user_response.user


def _get_image_count(supabase, collection_id: int) -> int:
    """Return the number of photos linked to a collection."""
    try:
        result = (
            supabase.table("collections_to_photos")
            .select("photo_id", count="exact")
            .eq("collection_id", collection_id)
            .execute()
        )
        return result.count if result.count is not None else len(result.data)
    except Exception:
        return 0


def _get_cover_image_url(supabase, collection_id: int) -> Optional[str]:
    """Return the URL of the first photo in a collection, or None."""
    try:
        result = (
            supabase.table("collections_to_photos")
            .select("photo_id")
            .eq("collection_id", collection_id)
            .order("order_id")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        photo_id = result.data[0]["photo_id"]
        photo_result = (
            supabase.table("photos")
            .select("url")
            .eq("id", photo_id)
            .limit(1)
            .execute()
        )
        if photo_result.data:
            return photo_result.data[0]["url"]
        return None
    except Exception:
        return None


def _build_collection_metrics(
    supabase,
    collection_ids: list[int],
) -> tuple[dict[int, int], dict[int, Optional[str]]]:
    """Return count and cover-url maps for a set of collection IDs with batched queries."""
    if not collection_ids:
        return {}, {}

    count_map = {collection_id: 0 for collection_id in collection_ids}
    cover_url_map = {collection_id: None for collection_id in collection_ids}

    try:
        links = (
            supabase.table("collections_to_photos")
            .select("collection_id, photo_id, order_id")
            .in_("collection_id", collection_ids)
            .order("order_id")
            .execute()
        )
    except Exception as e:
        logger.warning(f"Failed to load collection metrics in batch: {e}")
        return count_map, cover_url_map

    first_photo_by_collection: dict[int, int] = {}

    for link in links.data or []:
        collection_id = link["collection_id"]
        photo_id = link["photo_id"]

        count_map[collection_id] = count_map.get(collection_id, 0) + 1
        if collection_id not in first_photo_by_collection:
            first_photo_by_collection[collection_id] = photo_id

    if not first_photo_by_collection:
        return count_map, cover_url_map

    first_photo_ids = list(first_photo_by_collection.values())

    try:
        photos = (
            supabase.table("photos")
            .select("id, url")
            .in_("id", first_photo_ids)
            .execute()
        )
    except Exception as e:
        logger.warning(f"Failed to load collection cover photos in batch: {e}")
        return count_map, cover_url_map

    photo_url_map = {
        photo["id"]: photo.get("url")
        for photo in (photos.data or [])
    }

    for collection_id, photo_id in first_photo_by_collection.items():
        cover_url_map[collection_id] = photo_url_map.get(photo_id)

    return count_map, cover_url_map


def _enrich_collection(supabase, row: dict) -> CollectionResponse:
    """Turn a raw DB row into a CollectionResponse with image_count and cover image."""
    count_map, cover_url_map = _build_collection_metrics(supabase, [row["id"]])

    return CollectionResponse(
        id=row["id"],
        title=row["title"],
        user_id=row["user_id"],
        order_id=row.get("order_id", 0),
        image_count=count_map.get(row["id"], 0),
        pinned=row.get("pinned", False),
        cover_image_url=cover_url_map.get(row["id"]),
        last_used_at=row.get("last_used_at"),
    )


def _touch_collection(supabase, collection_id: int) -> None:
    """Update the last_used_at timestamp for a collection."""
    try:
        supabase.table("collections").update(
            {"last_used_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", collection_id).execute()
    except Exception as e:
        logger.warning(f"Failed to touch collection {collection_id}: {e}")


# ──────────────────── List all collections ───────────────────────

@router.get("/", response_model=CollectionListResponse)
def list_collections(access_token: str = Query(...)):
    """Return every collection belonging to the authenticated user."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    try:
        result = (
            supabase.table("collections")
            .select("*")
            .eq("user_id", user.id)
            .order("pinned", desc=True)
            .order("last_used_at", desc=True, nullsfirst=False)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch collections")

    rows = result.data or []
    collection_ids = [row["id"] for row in rows]
    count_map, cover_url_map = _build_collection_metrics(supabase, collection_ids)

    collections = [
        CollectionResponse(
            id=row["id"],
            title=row["title"],
            user_id=row["user_id"],
            order_id=row.get("order_id", 0),
            image_count=count_map.get(row["id"], 0),
            pinned=row.get("pinned", False),
            cover_image_url=cover_url_map.get(row["id"]),
            last_used_at=row.get("last_used_at"),
        )
        for row in rows
    ]
    return CollectionListResponse(collections=collections, count=len(collections))


@router.post("/photo-counts", response_model=PhotoCollectionCountsResponse)
def get_photo_collection_counts(
    access_token: str = Query(...),
    body: PhotoCollectionCountsRequest = Body(...),
):
    """Return how many collections contain each requested photo."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    requested_ids = list(dict.fromkeys(body.photo_ids))
    if not requested_ids:
        return PhotoCollectionCountsResponse(counts={})

    try:
        owned = (
            supabase.table("photos")
            .select("id")
            .eq("user_id", user.id)
            .in_("id", requested_ids)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to verify photo ownership for counts: {e}")
        raise HTTPException(status_code=500, detail="Failed to load photo ownership")

    owned_ids = {row["id"] for row in (owned.data or [])}
    count_map: dict[str, int] = {str(photo_id): 0 for photo_id in requested_ids}

    if not owned_ids:
        return PhotoCollectionCountsResponse(counts=count_map)

    try:
        links = (
            supabase.table("collections_to_photos")
            .select("photo_id")
            .in_("photo_id", list(owned_ids))
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to load collection-photo links for counts: {e}")
        raise HTTPException(status_code=500, detail="Failed to load collection counts")

    for link in links.data or []:
        key = str(link["photo_id"])
        if key in count_map:
            count_map[key] += 1

    return PhotoCollectionCountsResponse(counts=count_map)


# ──────────────────── Create a collection ────────────────────────

@router.post("/", response_model=CollectionResponse, status_code=201)
def create_collection(
    access_token: str = Query(...),
    body: CreateCollectionRequest = Body(...),
):
    """Create a new collection."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    try:
        # Get next order_id for this user
        last = (
            supabase.table("collections")
            .select("order_id")
            .eq("user_id", user.id)
            .order("order_id", desc=True)
            .limit(1)
            .execute()
        )
        next_order = (last.data[0]["order_id"] + 1) if last.data else 0

        result = (
            supabase.table("collections")
            .insert({
                "title": body.title.strip(),
                "user_id": user.id,
                "order_id": next_order,
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create collection")

        return _enrich_collection(supabase, result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create collection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create collection: {str(e)}")


# ──────────────────── Get a single collection ────────────────────

@router.get("/{collection_id}", response_model=CollectionResponse)
def get_collection(collection_id: int, access_token: str = Query(...)):
    """Return a single collection by ID."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    result = safe_maybe_single(
        supabase.table("collections")
        .select("*")
        .eq("id", collection_id)
        .eq("user_id", user.id)
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    _touch_collection(supabase, collection_id)

    return _enrich_collection(supabase, result.data)


# ──────────────────── Update a collection ────────────────────────

@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int,
    access_token: str = Query(...),
    body: UpdateCollectionRequest = Body(...),
):
    """Update a collection's title."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    existing = safe_maybe_single(
        supabase.table("collections")
        .select("*")
        .eq("id", collection_id)
        .eq("user_id", user.id)
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    update_data = {}
    if body.title is not None:
        update_data["title"] = body.title.strip()

    if not update_data:
        return _enrich_collection(supabase, existing.data)

    try:
        result = (
            supabase.table("collections")
            .update(update_data)
            .eq("id", collection_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update collection")

        return _enrich_collection(supabase, result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update collection: {e}")
        raise HTTPException(status_code=500, detail="Failed to update collection")


# ──────────────────── Delete a collection ────────────────────────


@router.patch("/{collection_id}/pin", response_model=CollectionResponse)
def toggle_pin_collection(collection_id: int, access_token: str = Query(...)):
    """Toggle the pinned status of a collection."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    existing = safe_maybe_single(
        supabase.table("collections")
        .select("*")
        .eq("id", collection_id)
        .eq("user_id", user.id)
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    new_pinned = not existing.data.get("pinned", False)

    try:
        result = (
            supabase.table("collections")
            .update({"pinned": new_pinned})
            .eq("id", collection_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update pin status")

        return _enrich_collection(supabase, result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle pin for collection {collection_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update pin status")


@router.delete("/{collection_id}", status_code=204)
def delete_collection(collection_id: int, access_token: str = Query(...)):
    """Delete a collection and its photo links (photos themselves are kept)."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    existing = safe_maybe_single(
        supabase.table("collections")
        .select("id")
        .eq("id", collection_id)
        .eq("user_id", user.id)
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Remove junction rows first
    try:
        supabase.table("collections_to_photos").delete().eq("collection_id", collection_id).execute()
    except Exception as e:
        logger.error(f"Failed to clean up collection–photo links: {e}")

    # Delete the collection itself
    try:
        supabase.table("collections").delete().eq("id", collection_id).eq("user_id", user.id).execute()
    except Exception as e:
        logger.error(f"Failed to delete collection: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete collection")

    return None


# ──────────── Get photos in a collection ─────────────────────────

@router.get("/{collection_id}/photos")
def get_collection_photos(collection_id: int, access_token: str = Query(...)):
    """Return all photos that belong to a collection, ordered by order_id."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # Verify the collection belongs to the user
    col = safe_maybe_single(
        supabase.table("collections")
        .select("id")
        .eq("id", collection_id)
        .eq("user_id", user.id)
    )
    if not col.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    try:
        links = (
            supabase.table("collections_to_photos")
            .select("photo_id, order_id")
            .eq("collection_id", collection_id)
            .order("order_id")
            .execute()
        )

        if not links.data:
            return {"photos": [], "count": 0}

        photo_ids = [link["photo_id"] for link in links.data]

        photos = (
            supabase.table("photos")
            .select("*")
            .in_("id", photo_ids)
            .execute()
        )

        # Preserve the collection ordering
        order_map = {link["photo_id"]: link["order_id"] for link in links.data}
        sorted_photos = sorted(photos.data, key=lambda p: order_map.get(p["id"], 0))

        return {"photos": sorted_photos, "count": len(sorted_photos)}
    except Exception as e:
        logger.error(f"Failed to get collection photos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch collection photos")


# ──────────── Add a photo to a collection ────────────────────────

@router.post("/{collection_id}/photos", status_code=201)
def add_photo_to_collection(
    collection_id: int,
    access_token: str = Query(...),
    body: CollectionPhotoRequest = Body(...),
):
    """Link an existing photo to a collection."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # Verify ownership of both collection and photo
    col = safe_maybe_single(
        supabase.table("collections").select("id").eq("id", collection_id).eq("user_id", user.id)
    )
    if not col.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    photo = safe_maybe_single(
        supabase.table("photos").select("id").eq("id", body.photo_id).eq("user_id", user.id)
    )
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Get next order_id
    try:
        existing = (
            supabase.table("collections_to_photos")
            .select("order_id")
            .eq("collection_id", collection_id)
            .order("order_id", desc=True)
            .limit(1)
            .execute()
        )
        next_order = (existing.data[0]["order_id"] + 1) if existing.data else 0
    except Exception:
        next_order = 0

    try:
        supabase.table("collections_to_photos").insert({
            "collection_id": collection_id,
            "photo_id": body.photo_id,
            "order_id": next_order,
        }).execute()
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Photo already in collection")
        logger.error(f"Failed to add photo to collection: {e}")
        raise HTTPException(status_code=500, detail="Failed to add photo to collection")

    _touch_collection(supabase, collection_id)

    return {"message": "Photo added to collection", "order_id": next_order}


# ──────────── Remove a photo from a collection ──────────────────

@router.delete("/{collection_id}/photos/{photo_id}", status_code=204)
def remove_photo_from_collection(
    collection_id: int,
    photo_id: int,
    access_token: str = Query(...),
):
    """Remove a photo from a collection (does not delete the photo itself)."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # Verify ownership of collection
    col = safe_maybe_single(
        supabase.table("collections").select("id").eq("id", collection_id).eq("user_id", user.id)
    )
    if not col.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    try:
        supabase.table("collections_to_photos").delete().eq(
            "collection_id", collection_id
        ).eq("photo_id", photo_id).execute()
    except Exception as e:
        logger.error(f"Failed to remove photo from collection: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove photo from collection")

    return None


# ──────── Reorder photos inside a collection ─────────────────────

@router.put("/{collection_id}/photos/reorder")
def reorder_collection_photos(
    collection_id: int,
    access_token: str = Query(...),
    body: ReorderCollectionPhotosRequest = Body(...),
):
    """Update the order_id of photos within a collection."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    col = safe_maybe_single(
        supabase.table("collections").select("id").eq("id", collection_id).eq("user_id", user.id)
    )
    if not col.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    for item in body.photos:
        try:
            supabase.table("collections_to_photos").update({
                "order_id": item.order_id,
            }).eq("collection_id", collection_id).eq("photo_id", item.id).execute()
        except Exception as e:
            logger.error(f"Failed to reorder photo {item.id}: {e}")

    return {"message": "Collection photo order updated"}


# ──────── Get collections that contain a specific photo ──────────

@router.get("/by-photo/{photo_id}")
def get_collections_for_photo(
    photo_id: int,
    access_token: str = Query(...),
):
    """Return all collections that contain a given photo."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)

    # Verify ownership of the photo
    photo = safe_maybe_single(
        supabase.table("photos").select("id").eq("id", photo_id).eq("user_id", user.id)
    )
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Get the collection IDs linked to this photo
    links = (
        supabase.table("collections_to_photos")
        .select("collection_id")
        .eq("photo_id", photo_id)
        .execute()
    )

    if not links.data:
        return {"collections": []}

    collection_ids = [link["collection_id"] for link in links.data]

    # Fetch those collections
    cols = (
        supabase.table("collections")
        .select("*")
        .eq("user_id", user.id)
        .in_("id", collection_ids)
        .order("order_id")
        .execute()
    )

    rows = cols.data or []
    collection_ids = [row["id"] for row in rows]
    count_map, cover_url_map = _build_collection_metrics(supabase, collection_ids)

    collections = [
        CollectionResponse(
            id=row["id"],
            title=row["title"],
            user_id=row["user_id"],
            order_id=row.get("order_id", 0),
            image_count=count_map.get(row["id"], 0),
            pinned=row.get("pinned", False),
            cover_image_url=cover_url_map.get(row["id"]),
            last_used_at=row.get("last_used_at"),
        )
        for row in rows
    ]

    return {"collections": collections}
