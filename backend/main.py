# backend/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.photos import router as photos_router

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

@app.get("/api/status")
async def get_status():
    return {"message": "De verbinding met Python werkt!"}