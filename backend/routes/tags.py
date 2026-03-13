import logging
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, ConfigDict
from typing import Optional
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tags", tags=["Tags"])

# Schemas

class TagResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: int
    name: str
    color_hex: str

class TagListResponse(BaseModel):
    tags: list[TagResponse]
    count: int

class PhotoTagsMap(BaseModel):
    """Maps photo IDs to their tags."""
    photo_tags: dict[str, list[TagResponse]]

class CreateTagRequest(BaseModel):
    name: str
    color_hex: str

class UpdateTagRequest(BaseModel):
    name: Optional[str] = None
    color_hex: Optional[str] = None


def get_current_user(supabase, access_token: str):
    """Helper to get and validate current user, and set auth header for RLS."""
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail=str(e))
    
    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Set the access token on the client for RLS policies to work
    supabase.postgrest.auth(access_token)
    
    return user_response.user


# List all tags for the authenticated user

@router.get("/", response_model=TagListResponse)
def list_tags(access_token: str = Query(...)):
    """List all tags for the current user."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        result = (
            supabase.table("tags")
            .select("id, name, color_hex")
            .eq("user_id", user.id)
            .order("name")
            .execute()
        )
        
        tags = [TagResponse(**row) for row in result.data]
        return TagListResponse(tags=tags, count=len(tags))
    except Exception as e:
        logger.error(f"Failed to list tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tags")


# Create a new tag

@router.post("/", response_model=TagResponse, status_code=201)
def create_tag(access_token: str = Query(...), body: CreateTagRequest = Body(...)):
    """Create a new tag."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    tag_name = body.name.strip().lower()
    
    try:
        # Check if tag with same name already exists for this user
        existing = safe_maybe_single(
            supabase.table("tags")
            .select("id, name, color_hex")
            .eq("name", tag_name)
            .eq("user_id", user.id)
        )

        if existing.data:
            # Idempotent behavior: if the tag already exists, return it.
            return TagResponse(**existing.data)

        # Insert new tag
        result = (
            supabase.table("tags")
            .insert({
                "name": tag_name,
                "color_hex": body.color_hex,
                "user_id": user.id,
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create tag")

        return TagResponse(
            id=result.data[0]["id"],
            name=result.data[0]["name"],
            color_hex=result.data[0]["color_hex"]
        )
    except HTTPException:
        raise
    except Exception as e:
        # Handle unique-constraint races gracefully: another request may have created
        # the same tag between the existence check and insert.
        if getattr(e, "code", None) == "23505" or "23505" in str(e):
            existing_after_conflict = safe_maybe_single(
                supabase.table("tags")
                .select("id, name, color_hex")
                .eq("name", tag_name)
                .eq("user_id", user.id)
            )
            if existing_after_conflict.data:
                return TagResponse(**existing_after_conflict.data)

            raise HTTPException(
                status_code=409,
                detail="Tag with this name already exists",
            )

        logger.error(f"Failed to create tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to create tag")


# Get a single tag

@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, access_token: str = Query(...)):
    """Get a single tag by ID."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        result = safe_maybe_single(
            supabase.table("tags")
            .select("id, name, color_hex")
            .eq("id", tag_id)
            .eq("user_id", user.id)
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Tag not found")

        return TagResponse(**result.data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to get tag")


# Update a tag

@router.patch("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: int, access_token: str = Query(...), body: UpdateTagRequest = Body(...)):
    """Update a tag."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        # Check if tag exists and belongs to user
        existing = safe_maybe_single(
            supabase.table("tags")
            .select("id, name, color_hex")
            .eq("id", tag_id)
            .eq("user_id", user.id)
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Build update dict
        update_data = {}
        if body.name is not None:
            new_name = body.name.strip().lower()
            # Check for duplicate name
            duplicate = safe_maybe_single(
                supabase.table("tags")
                .select("id")
                .eq("name", new_name)
                .eq("user_id", user.id)
                .neq("id", tag_id)
            )
            if duplicate.data:
                raise HTTPException(status_code=400, detail="Tag with this name already exists")
            update_data["name"] = new_name
            
        if body.color_hex is not None:
            update_data["color_hex"] = body.color_hex

        if not update_data:
            return TagResponse(**existing.data)

        result = (
            supabase.table("tags")
            .update(update_data)
            .eq("id", tag_id)
            .eq("user_id", user.id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update tag")

        return TagResponse(
            id=result.data[0]["id"],
            name=result.data[0]["name"],
            color_hex=result.data[0]["color_hex"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to update tag")


# Delete a tag

@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, access_token: str = Query(...)):
    """Delete a tag and remove all photo associations."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        # Check if tag exists and belongs to user
        existing = safe_maybe_single(
            supabase.table("tags")
            .select("id")
            .eq("id", tag_id)
            .eq("user_id", user.id)
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Delete photo associations first
        try:
            supabase.table("photos_to_tags").delete().eq("tag_id", tag_id).execute()
        except Exception as e:
            logger.warning(f"Failed to delete photo associations: {e}")

        # Delete the tag
        supabase.table("tags").delete().eq("id", tag_id).eq("user_id", user.id).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete tag")


# Add tag to photo

@router.post("/photo/{photo_id}/tag/{tag_id}", status_code=201)
def add_tag_to_photo(photo_id: int, tag_id: int, access_token: str = Query(...)):
    """Associate a tag with a photo."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        # Verify photo belongs to user
        photo = safe_maybe_single(
            supabase.table("photos")
            .select("id")
            .eq("id", photo_id)
            .eq("user_id", user.id)
        )

        if not photo.data:
            raise HTTPException(status_code=404, detail="Photo not found")

        # Verify tag belongs to user.
        tag = safe_maybe_single(
            supabase.table("tags")
            .select("id")
            .eq("id", tag_id)
            .eq("user_id", user.id)
        )

        if not tag.data:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Check if association already exists
        existing = safe_maybe_single(
            supabase.table("photos_to_tags")
            .select("photo_id, tag_id")
            .eq("photo_id", photo_id)
            .eq("tag_id", tag_id)
        )

        if existing.data:
            return {"message": "Tag already associated with photo"}

        # Create association
        supabase.table("photos_to_tags").insert({
            "photo_id": photo_id,
            "tag_id": tag_id,
        }).execute()

        return {"message": "Tag added to photo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add tag to photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to add tag to photo")


# Remove tag from photo

@router.delete("/photo/{photo_id}/tag/{tag_id}", status_code=204)
def remove_tag_from_photo(photo_id: int, tag_id: int, access_token: str = Query(...)):
    """Remove a tag from a photo."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        # Verify photo belongs to user
        photo = safe_maybe_single(
            supabase.table("photos")
            .select("id")
            .eq("id", photo_id)
            .eq("user_id", user.id)
        )

        if not photo.data:
            raise HTTPException(status_code=404, detail="Photo not found")

        # Delete association
        supabase.table("photos_to_tags").delete().eq("photo_id", photo_id).eq("tag_id", tag_id).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove tag from photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove tag from photo")


# Get tags for a photo

@router.get("/photo/{photo_id}", response_model=TagListResponse)
def get_photo_tags(photo_id: int, access_token: str = Query(...)):
    """Get all tags associated with a photo."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        # Verify photo belongs to user
        photo = safe_maybe_single(
            supabase.table("photos")
            .select("id")
            .eq("id", photo_id)
            .eq("user_id", user.id)
        )

        if not photo.data:
            raise HTTPException(status_code=404, detail="Photo not found")

        # Get tag IDs for this photo
        associations = (
            supabase.table("photos_to_tags")
            .select("tag_id")
            .eq("photo_id", photo_id)
            .execute()
        )

        if not associations.data:
            return TagListResponse(tags=[], count=0)

        tag_ids = [a["tag_id"] for a in associations.data]

        # Get the actual tags
        result = (
            supabase.table("tags")
            .select("id, name, color_hex")
            .in_("id", tag_ids)
            .order("name")
            .execute()
        )

        tags = [TagResponse(**row) for row in result.data]
        return TagListResponse(tags=tags, count=len(tags))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get photo tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to get photo tags")


# Batch: get tags for multiple photos at once

@router.get("/photos/batch", response_model=PhotoTagsMap)
def get_batch_photo_tags(access_token: str = Query(...), photo_ids: str = Query(..., description="Comma-separated photo IDs")):
    """Get tags for multiple photos in a single request."""
    supabase = get_supabase()
    user = get_current_user(supabase, access_token)

    try:
        ids = [int(pid.strip()) for pid in photo_ids.split(",") if pid.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid photo_ids format")

    if not ids:
        return PhotoTagsMap(photo_tags={})

    try:
        # Get all photo-tag associations for these photos
        associations = (
            supabase.table("photos_to_tags")
            .select("photo_id, tag_id")
            .in_("photo_id", ids)
            .execute()
        )

        if not associations.data:
            return PhotoTagsMap(photo_tags={str(pid): [] for pid in ids})

        # Collect unique tag IDs
        tag_ids = list({a["tag_id"] for a in associations.data})

        # Fetch all tags at once
        tags_result = (
            supabase.table("tags")
            .select("id, name, color_hex")
            .in_("id", tag_ids)
            .eq("user_id", user.id)
            .execute()
        )

        tag_map = {t["id"]: TagResponse(**t) for t in tags_result.data}

        # Build the response map
        photo_tags: dict[str, list[TagResponse]] = {str(pid): [] for pid in ids}
        for assoc in associations.data:
            pid = str(assoc["photo_id"])
            tid = assoc["tag_id"]
            if tid in tag_map and pid in photo_tags:
                photo_tags[pid].append(tag_map[tid])

        return PhotoTagsMap(photo_tags=photo_tags)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get batch photo tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to get batch photo tags")
