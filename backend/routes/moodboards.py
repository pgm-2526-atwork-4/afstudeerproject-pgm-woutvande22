import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/moodboards", tags=["Moodboards"])


# ──────────────────────────── Schemas ────────────────────────────

class MoodboardResponse(BaseModel):
    id: int
    collection_id: int
    background_color: str


class MoodboardItemResponse(BaseModel):
    id: int
    moodboard_id: int
    type: str
    photo_id: Optional[int] = None
    text_content: Optional[str] = None
    x_pos: float
    y_pos: float
    width: float
    height: float
    z_index: int
    scale: float
    border_radius: int
    locked: bool
    hidden: bool


class SaveMoodboardRequest(BaseModel):
    background_color: str = "#EDEDED"


class SaveMoodboardItemRequest(BaseModel):
    photo_id: Optional[int] = None
    type: str = "image"
    text_content: Optional[str] = None
    x_pos: float = 0
    y_pos: float = 0
    width: float = 240
    height: float = 240
    z_index: int = 0
    scale: float = 1
    border_radius: int = 0
    locked: bool = False
    hidden: bool = False


class SaveMoodboardFullRequest(BaseModel):
    background_color: str = "#EDEDED"
    items: list[SaveMoodboardItemRequest]


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


def _verify_collection_ownership(supabase, collection_id: int, user_id: str):
    """Verify the collection belongs to the user."""
    col = safe_maybe_single(
        supabase.table("collections")
        .select("id")
        .eq("id", collection_id)
        .eq("user_id", user_id)
    )
    if not col.data:
        raise HTTPException(status_code=404, detail="Collection not found")


# ──────────── Get moodboard for a collection ─────────────────────

@router.get("/collection/{collection_id}")
def get_moodboard(collection_id: int, access_token: str = Query(...)):
    """Return the moodboard and its items for a given collection."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)
    _verify_collection_ownership(supabase, collection_id, user.id)

    try:
        # Get or auto-create the moodboard row
        moodboard = safe_maybe_single(
            supabase.table("moodboards")
            .select("*")
            .eq("collection_id", collection_id)
        )

        if not moodboard.data:
            # No moodboard yet — return empty
            return {
                "moodboard": None,
                "items": [],
            }

        mb = moodboard.data

        # Fetch items
        items_result = (
            supabase.table("moodboard_items")
            .select("*")
            .eq("moodboard_id", mb["id"])
            .order("z_index")
            .execute()
        )

        return {
            "moodboard": mb,
            "items": items_result.data or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get moodboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch moodboard: {str(e)}")


# ──────────── Save (upsert) full moodboard ───────────────────────

@router.put("/collection/{collection_id}")
def save_moodboard(
    collection_id: int,
    body: SaveMoodboardFullRequest,
    access_token: str = Query(...),
):
    """Save the full moodboard state: upsert the moodboard row and replace all items."""
    supabase = get_supabase()
    user = _get_current_user(supabase, access_token)
    _verify_collection_ownership(supabase, collection_id, user.id)

    try:
        # Upsert the moodboard row
        moodboard = safe_maybe_single(
            supabase.table("moodboards")
            .select("id")
            .eq("collection_id", collection_id)
        )

        if moodboard.data:
            moodboard_id = moodboard.data["id"]
            supabase.table("moodboards").update({
                "background_color": body.background_color,
            }).eq("id", moodboard_id).execute()
        else:
            result = supabase.table("moodboards").insert({
                "collection_id": collection_id,
                "background_color": body.background_color,
            }).execute()
            moodboard_id = result.data[0]["id"]

        # Delete existing items and insert new ones
        supabase.table("moodboard_items").delete().eq(
            "moodboard_id", moodboard_id
        ).execute()

        if body.items:
            rows = [
                {
                    "moodboard_id": moodboard_id,
                    "type": item.type,
                    "photo_id": item.photo_id,
                    "text_content": item.text_content,
                    "x_pos": item.x_pos,
                    "y_pos": item.y_pos,
                    "width": item.width,
                    "height": item.height,
                    "z_index": item.z_index,
                    "scale": item.scale,
                    "border_radius": item.border_radius,
                    "locked": item.locked,
                    "hidden": item.hidden,
                }
                for item in body.items
            ]
            supabase.table("moodboard_items").insert(rows).execute()

        return {"detail": "Moodboard saved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save moodboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save moodboard: {str(e)}")
