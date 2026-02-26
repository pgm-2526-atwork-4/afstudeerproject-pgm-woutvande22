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

class PhotoResponse(BaseModel):
    id: int
    url: str
    user_id: str
    file_size_mb: float

class PhotoListResponse(BaseModel):
    photos: list[PhotoResponse]
    count: int