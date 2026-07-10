from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import llm
from app.db import init_db
from app.routers import flashcards, progress, quiz, tutor

app = FastAPI(title="Homework Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(tutor.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(progress.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "provider": llm.active_provider()}
