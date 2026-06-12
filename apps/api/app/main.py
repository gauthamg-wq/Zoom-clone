import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from routers import meetings, participants
from websocket import signaling

app = FastAPI(title="Zoom Clone API", version="0.1.0")

# --- CORS ---
# Comma-separated list of allowed origins.
# Production: set CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000 on Render.
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB init ---
# Creates all tables on startup if they do not exist (no Alembic for MVP).
Base.metadata.create_all(bind=engine)

# --- Routers ---
app.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
app.include_router(participants.router, prefix="/participants", tags=["participants"])
app.include_router(signaling.router, tags=["websocket"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
