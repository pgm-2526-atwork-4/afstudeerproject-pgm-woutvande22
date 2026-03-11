import os
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from google import genai
from dependencies import get_supabase, safe_maybe_single

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}

# Configure Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


# Schemas

class TagSuggestion(BaseModel):
    tags: list[str]
    description: str


@router.post("/tag-image", response_model=TagSuggestion)
async def tag_image(
    access_token: str = Query(...),
    file: UploadFile = File(...),
):
    """Upload an image and get AI-generated tag suggestions and a description from Gemini."""
    # 1. Authenticate the user
    supabase = get_supabase()
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 2. Validate API key
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # 3. Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use: {', '.join(ALLOWED_TYPES)}",
        )

    # 4. Read file content
    content = await file.read()

    # 5. Send to Gemini
    prompt = (
        "Analyze this image. Return a JSON object with exactly two keys:\n"
        '- "tags": an array of 5 relevant single-word or short tags (lowercase, English)\n'
        '- "description": a short one-sentence description of the image\n'
        "Return ONLY valid JSON, no markdown fences or extra text."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                genai.types.Part.from_bytes(data=content, mime_type=file.content_type),
            ],
        )
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image with AI")

    return _parse_gemini_tags(response.text)


def _parse_gemini_tags(raw_text: str) -> TagSuggestion:
    """Parse the Gemini response text into a TagSuggestion."""
    raw = raw_text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        data = json.loads(raw)
        tags = [str(t).strip().lower() for t in data.get("tags", [])][:10]
        description = str(data.get("description", ""))
    except (json.JSONDecodeError, KeyError):
        logger.warning(f"Failed to parse Gemini response: {raw}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    return TagSuggestion(tags=tags, description=description)


@router.post("/tag-photo/{photo_id}", response_model=TagSuggestion)
async def tag_existing_photo(
    photo_id: int,
    access_token: str = Query(...),
):
    """Generate AI tags for an existing photo by its ID."""
    supabase = get_supabase()

    # 1. Authenticate
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # 2. Fetch the photo record
    result = safe_maybe_single(
        supabase.table("photos")
        .select("url")
        .eq("id", photo_id)
        .eq("user_id", user_response.user.id)
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo_url = result.data["url"] if isinstance(result.data, dict) else result.data[0]["url"]

    # 3. Download the image
    try:
        async with httpx.AsyncClient() as http:
            resp = await http.get(photo_url)
            resp.raise_for_status()
            content = resp.content
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]
    except Exception as e:
        logger.error(f"Failed to download photo {photo_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to download image")

    # 4. Send to Gemini
    prompt = (
        "Analyze this image. Return a JSON object with exactly two keys:\n"
        '- "tags": an array of 5 relevant single-word or short tags (lowercase, English)\n'
        '- "description": a short one-sentence description of the image\n'
        "Return ONLY valid JSON, no markdown fences or extra text."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                genai.types.Part.from_bytes(data=content, mime_type=content_type),
            ],
        )
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image with AI")

    return _parse_gemini_tags(response.text)
