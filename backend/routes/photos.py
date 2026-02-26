import logging
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from typing import Optional
from dependencies import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/photos", tags=["Photos"])

BUCKET_NAME = "photos"
ALLOWED_ITEMS = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10

# Schemas

class PhotoResponse(BaseModel):
    id: int
    url: str
    user_id: str
    file_size_mb: float

class PhotoListResponse(BaseModel):
    photos: list[PhotoResponse]
    count: int

# upload

@router.post("/upload", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    access_token: str = Query(...),
    collection_id: Optional[int] = Query(None),
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
    profile = (
        supabase.table("users")
        .select("current_storage_mb, subscription_id")
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )

    if profile.data:
        current_storage = profile.data.get("current_storage_mb", 0)
        sub_id = profile.data.get("subscription_id")

        # Get storage limit from subscriptions table
        if sub_id:
            sub = (
                supabase.table("subscriptions")
                .select("storage_limit_mb")
                .eq("id", sub_id)
                .maybe_single()
                .execute()
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
    try:
        photo_record = (
            supabase.table("photos")
            .insert({
                "url": public_url,
                "user_id": user.id,
                "file_size_mb": file_size_mb,
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

    result = (
        supabase.table("photos")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    return PhotoListResponse(photos=result.data, count=len(result.data))