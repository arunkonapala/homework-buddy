from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import llm
from app.db import get_db

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

MAX_BOX = 5  # Leitner boxes: 1 (new/struggling) .. 5 (mastered)

CARDS_SYSTEM = (
    "You write flashcards for a 4th grader (age 9-10). Fronts are short questions "
    "or terms; backs are simple, memorable answers a 9-year-old can understand."
)

CARDS_SCHEMA = {
    "type": "object",
    "properties": {
        "cards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": {"type": "string"},
                    "back": {"type": "string"},
                },
                "required": ["front", "back"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["cards"],
    "additionalProperties": False,
}


class GenerateRequest(BaseModel):
    subject: str
    topic: str
    count: int = Field(default=8, ge=1, le=20)


class AnswerRequest(BaseModel):
    correct: bool


@router.post("/generate")
def generate_cards(req: GenerateRequest) -> dict:
    prompt = (
        f"Create {req.count} flashcards for a 4th grader.\n"
        f"Subject: {req.subject}\nTopic: {req.topic}"
    )
    try:
        data = llm.generate_json(CARDS_SYSTEM, prompt, CARDS_SCHEMA)
    except llm.LLMError as e:
        raise HTTPException(503, str(e))
    cards = data.get("cards", [])
    if not cards:
        raise HTTPException(502, "Flashcard generation returned no cards.")
    with get_db() as conn:
        conn.executemany(
            "INSERT INTO flashcards (subject, topic, front, back) VALUES (?, ?, ?, ?)",
            [(req.subject, req.topic, c["front"], c["back"]) for c in cards],
        )
    return {"created": len(cards)}


@router.get("/review")
def review_cards(subject: str = "", limit: int = 10) -> dict:
    # Lowest box first = the cards the student struggles with most come up first.
    query = (
        "SELECT id, subject, topic, front, back, box FROM flashcards "
        "WHERE box < ? {} ORDER BY box ASC, RANDOM() LIMIT ?"
    )
    params: list = [MAX_BOX]
    clause = ""
    if subject:
        clause = "AND subject = ?"
        params.append(subject)
    params.append(limit)
    with get_db() as conn:
        rows = conn.execute(query.format(clause), params).fetchall()
        mastered = conn.execute(
            "SELECT COUNT(*) FROM flashcards WHERE box >= ?", (MAX_BOX,)
        ).fetchone()[0]
        total = conn.execute("SELECT COUNT(*) FROM flashcards").fetchone()[0]
    return {"cards": [dict(r) for r in rows], "mastered": mastered, "total": total}


@router.post("/{card_id}/answer")
def answer_card(card_id: int, req: AnswerRequest) -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT box FROM flashcards WHERE id = ?", (card_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Card not found")
        box = min(row["box"] + 1, MAX_BOX) if req.correct else 1
        conn.execute("UPDATE flashcards SET box = ? WHERE id = ?", (box, card_id))
    return {"box": box, "mastered": box >= MAX_BOX}
