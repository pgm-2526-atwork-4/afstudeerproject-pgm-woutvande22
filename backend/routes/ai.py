import os
import json
import logging
import re
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel, Field
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


class GenerateCollectionRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=400)
    max_photos: int = Field(default=30, ge=1, le=100)


class GenerateCollectionPreviewResponse(BaseModel):
    suggested_title: str
    selected_tags: list[str]
    suggested_photo_ids: list[int]
    matched_count: int


class GenerateCollectionResponse(BaseModel):
    collection_id: int
    collection_title: str
    selected_tags: list[str]
    matched_count: int


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


def _extract_json_payload(raw_text: str) -> dict:
    """Extract a JSON object from a Gemini text response."""
    raw = raw_text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")

        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")


def _tokenize_text(value: str) -> set[str]:
    """Normalize text into simple word tokens for lightweight relevance scoring."""
    return {
        token
        for token in re.findall(r"[a-z0-9]+", value.lower())
        if len(token) > 2
    }


def _build_collection_suggestion(supabase, user_id: str, prompt: str, max_photos: int) -> tuple[str, list[str], list[int]]:
    """Return (title, selected_tags, ordered_photo_ids) for a prompt without creating records."""
    # Load available user tags
    try:
        tags_result = (
            supabase.table("tags")
            .select("id, name")
            .eq("user_id", user_id)
            .order("name")
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to load user tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to load tags")

    user_tags = tags_result.data or []
    if not user_tags:
        raise HTTPException(
            status_code=400,
            detail="No tags found. Add tags to your photos before generating a collection.",
        )

    tag_names = [str(tag["name"]).strip().lower() for tag in user_tags if tag.get("name")]
    tag_id_by_name = {str(tag["name"]).strip().lower(): tag["id"] for tag in user_tags if tag.get("name")}

    # Ask Gemini which existing tags to use for this prompt
    ai_prompt = (
        "You are selecting existing user tags for a photo collection.\n"
        "Given the user's prompt and available tags, return ONLY JSON with this exact shape:\n"
        '{"title": "short collection title", "tags": ["tag1", "tag2", "tag3"]}\n'
        "Rules:\n"
        "- tags must come only from the available tags list\n"
        "- choose between 2 and 8 tags\n"
        "- keep title under 60 characters\n"
        "- do not include markdown or extra text\n\n"
        f"User prompt: {prompt}\n"
        f"Available tags: {json.dumps(tag_names)}"
    )

    try:
        ai_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[ai_prompt],
        )
    except Exception as e:
        logger.error(f"Gemini API error during collection generation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate collection with AI")

    payload = _extract_json_payload(ai_response.text)
    raw_tags = payload.get("tags", [])
    raw_title = str(payload.get("title", "")).strip()

    selected_tags: list[str] = []
    for raw_tag in raw_tags:
        normalized = str(raw_tag).strip().lower()
        if normalized in tag_id_by_name and normalized not in selected_tags:
            selected_tags.append(normalized)

    if not selected_tags:
        prompt_words = {w.strip(".,!?;:()[]{}\"'").lower() for w in prompt.split() if w.strip()}
        selected_tags = [tag for tag in tag_names if tag in prompt_words][:5]

    if not selected_tags:
        raise HTTPException(
            status_code=400,
            detail="No matching tags found for this prompt. Try a more specific prompt.",
        )

    selected_tag_ids = [tag_id_by_name[tag] for tag in selected_tags]

    # Find photos linked to selected tags and score tag overlap.
    try:
        associations = (
            supabase.table("photos_to_tags")
            .select("photo_id, tag_id")
            .in_("tag_id", selected_tag_ids)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to fetch tag-photo associations: {e}")
        raise HTTPException(status_code=500, detail="Failed to match photos by tags")

    tag_id_set = set(selected_tag_ids)
    score_by_photo: dict[int, int] = {}
    for row in (associations.data or []):
        try:
            photo_id = int(row["photo_id"])
            tag_id = int(row["tag_id"])
        except (TypeError, ValueError, KeyError):
            continue

        if tag_id in tag_id_set:
            score_by_photo[photo_id] = score_by_photo.get(photo_id, 0) + 1

    # Pull user photos and also score textual relevance from title/description.
    try:
        photos_result = (
            supabase.table("photos")
            .select("id, order_id, title, description")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to fetch candidate photos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch matched photos")

    owned_photos = photos_result.data or []
    if not owned_photos:
        raise HTTPException(status_code=404, detail="No photos matched the generated tags")

    prompt_tokens = _tokenize_text(prompt)
    selected_tag_tokens: set[str] = set()
    for tag in selected_tags:
        selected_tag_tokens.update(_tokenize_text(tag))

    candidate_photos: list[dict] = []
    for photo in owned_photos:
        photo_id = int(photo["id"])
        tag_score = score_by_photo.get(photo_id, 0)

        text_blob = f"{photo.get('title') or ''} {photo.get('description') or ''}".strip()
        text_tokens = _tokenize_text(text_blob) if text_blob else set()

        prompt_overlap = len(prompt_tokens.intersection(text_tokens))
        tag_word_overlap = len(selected_tag_tokens.intersection(text_tokens))
        text_score = prompt_overlap + tag_word_overlap

        # Keep photos with tag relevance or text relevance.
        if tag_score > 0 or text_score > 0:
            weighted_score = (tag_score * 3) + text_score
            candidate_photos.append(
                {
                    "id": photo_id,
                    "order_id": int(photo.get("order_id") or 0),
                    "score": weighted_score,
                }
            )

    if not candidate_photos:
        raise HTTPException(status_code=404, detail="No photos matched the generated tags or prompt text")

    ordered_photo_ids = [
        photo["id"]
        for photo in sorted(
            candidate_photos,
            key=lambda photo: (
                -int(photo["score"]),
                int(photo["order_id"]),
            ),
        )
    ][:max_photos]

    if not ordered_photo_ids:
        raise HTTPException(status_code=404, detail="No photos matched the generated tags")

    title = (raw_title if raw_title else prompt.strip())[:60].strip() or "AI Generated Collection"

    return title, selected_tags, ordered_photo_ids


@router.post("/preview-collection", response_model=GenerateCollectionPreviewResponse)
def preview_collection_with_ai(
    body: GenerateCollectionRequest,
    access_token: str = Query(...),
):
    """Return a generated collection preview without creating a collection yet."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.postgrest.auth(access_token)

    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    title, selected_tags, ordered_photo_ids = _build_collection_suggestion(
        supabase=supabase,
        user_id=user.id,
        prompt=body.prompt,
        max_photos=body.max_photos,
    )

    return GenerateCollectionPreviewResponse(
        suggested_title=title,
        selected_tags=selected_tags,
        suggested_photo_ids=ordered_photo_ids,
        matched_count=len(ordered_photo_ids),
    )


@router.post("/generate-collection", response_model=GenerateCollectionResponse, status_code=201)
def generate_collection_with_ai(
    body: GenerateCollectionRequest,
    access_token: str = Query(...),
):
    """Create a collection from a text prompt by selecting matching photos based on user tags."""
    supabase = get_supabase()

    # 1. Authenticate
    try:
        user_response = supabase.auth.get_user(access_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.postgrest.auth(access_token)

    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    title, selected_tags, ordered_photo_ids = _build_collection_suggestion(
        supabase=supabase,
        user_id=user.id,
        prompt=body.prompt,
        max_photos=body.max_photos,
    )

    # Create collection using suggested title/photos

    try:
        last = (
            supabase.table("collections")
            .select("order_id")
            .eq("user_id", user.id)
            .order("order_id", desc=True)
            .limit(1)
            .execute()
        )
        next_order = (last.data[0]["order_id"] + 1) if last.data else 0

        collection_result = (
            supabase.table("collections")
            .insert({
                "title": title,
                "user_id": user.id,
                "order_id": next_order,
            })
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to create generated collection: {e}")
        raise HTTPException(status_code=500, detail="Failed to create generated collection")

    if not collection_result.data:
        raise HTTPException(status_code=500, detail="Failed to create generated collection")

    collection = collection_result.data[0]
    collection_id = int(collection["id"])

    # 6. Link matched photos into the collection in ranked order
    rows = [
        {
            "collection_id": collection_id,
            "photo_id": photo_id,
            "order_id": index,
        }
        for index, photo_id in enumerate(ordered_photo_ids)
    ]

    try:
        if rows:
            supabase.table("collections_to_photos").insert(rows).execute()
    except Exception as e:
        logger.error(f"Failed to add photos to generated collection {collection_id}: {e}")
        # Best-effort rollback so we do not leave an empty collection on failure.
        try:
            supabase.table("collections").delete().eq("id", collection_id).eq("user_id", user.id).execute()
        except Exception as rollback_error:
            logger.error(f"Rollback failed for collection {collection_id}: {rollback_error}")
        raise HTTPException(status_code=500, detail="Failed to add photos to generated collection")

    return GenerateCollectionResponse(
        collection_id=collection_id,
        collection_title=collection["title"],
        selected_tags=selected_tags,
        matched_count=len(ordered_photo_ids),
    )


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
