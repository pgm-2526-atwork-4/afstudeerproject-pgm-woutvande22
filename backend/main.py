# backend/main.py
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

app = FastAPI(title="AI Image Tagger & Moodboarder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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