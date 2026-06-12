import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from routers import meetings, participants
from seed import seed
from websocket import signaling

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed()
    yield


app = FastAPI(title="Zoom Clone API", version="0.1.0", lifespan=lifespan)

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

# --- Routers ---
app.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
app.include_router(participants.router, prefix="/participants", tags=["participants"])
app.include_router(signaling.router, tags=["websocket"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
