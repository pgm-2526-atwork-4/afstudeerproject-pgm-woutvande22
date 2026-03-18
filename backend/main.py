# backend/main.py
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.photos import router as photos_router
from routes.tags import router as tags_router
from routes.collections import router as collections_router
from routes.moodboards import router as moodboards_router
from routes.ai import router as ai_router

is_production = os.getenv("ENV", "development").lower() == "production"


def _get_allowed_origins() -> list[str]:
    """Build the CORS allowlist from env while preserving local dev defaults."""
    defaults = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    configured = os.getenv("CORS_ORIGINS", "")
    parsed = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]

    merged = defaults + parsed
    # Preserve order and remove duplicates
    return list(dict.fromkeys(merged))

app = FastAPI(
    title="AI Image Tagger & Moodboarder API",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Register routers
app.include_router(auth_router)
app.include_router(photos_router)
app.include_router(tags_router)
app.include_router(collections_router)
app.include_router(moodboards_router)
app.include_router(ai_router)

@app.get("/api/status")
async def get_status():
    return {"message": "De verbinding met Python werkt!"}