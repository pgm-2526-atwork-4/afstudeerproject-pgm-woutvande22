import logging
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
    description: Optional[str] = None
    color: Optional[str] = None
    user_id: str
    image_count: int = 0


class CollectionListResponse(BaseModel):
    collections: list[CollectionResponse]
    count: int


class CreateCollectionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = "#4a86b5"


class UpdateCollectionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class CollectionPhotoRequest(BaseModel):
    photo_id: int


class ReorderCollectionItem(BaseModel):
    id: int
    order_id: int


class ReorderCollectionPhotosRequest(BaseModel):
    photos: list[ReorderCollectionItem]


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


def _enrich_collection(supabase, row: dict) -> CollectionResponse:
    """Turn a raw DB row into a CollectionResponse with image_count."""
    return CollectionResponse(
        id=row["id"],
        title=row["title"],
        description=row.get("description"),
        color=row.get("color"),
        user_id=row["user_id"],
        image_count=_get_image_count(supabase, row["id"]),
    )


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
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch collections")

    collections = [_enrich_collection(supabase, row) for row in result.data]
    return CollectionListResponse(collections=collections, count=len(collections))


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
        result = (
            supabase.table("collections")
            .insert({
                "title": body.title.strip(),
                "description": body.description,
                "color": body.color,
                "user_id": user.id,
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

    return _enrich_collection(supabase, result.data)


# ──────────────────── Update a collection ────────────────────────

@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int,
    access_token: str = Query(...),
    body: UpdateCollectionRequest = Body(...),
):
    """Update a collection's title, description, or color."""
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
    if body.description is not None:
        update_data["description"] = body.description
    if body.color is not None:
        update_data["color"] = body.color

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
