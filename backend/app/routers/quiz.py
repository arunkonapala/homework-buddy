from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import llm
from app.db import get_db

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

QUIZ_SYSTEM = (
    "You write fun, fair multiple-choice quizzes for a 4th grader (age 9-10). "
    "Questions must match a US 4th-grade curriculum level, use simple wording, "
    "and be positive in tone. Explanations should teach, not just state the answer."
)

QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "choices": {"type": "array", "items": {"type": "string"}},
                    "answer_index": {"type": "integer", "enum": [0, 1, 2, 3]},
                    "explanation": {"type": "string"},
                },
                "required": ["question", "choices", "answer_index", "explanation"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}


class GenerateRequest(BaseModel):
    subject: str
    topic: str = ""
    num_questions: int = Field(default=5, ge=1, le=10)


class SubmitRequest(BaseModel):
    subject: str
    topic: str = ""
    score: int = Field(ge=0)
    total: int = Field(ge=1)


@router.post("/generate")
def generate_quiz(req: GenerateRequest) -> dict:
    topic = req.topic.strip() or "a good mix of grade-appropriate topics"
    prompt = (
        f"Create a {req.num_questions}-question multiple-choice quiz for a 4th grader.\n"
        f"Subject: {req.subject}\nTopic: {topic}\n"
        "Each question must have exactly 4 choices with exactly one correct answer. "
        "Vary which position the correct answer is in."
    )
    try:
        data = llm.generate_json(QUIZ_SYSTEM, prompt, QUIZ_SCHEMA)
    except llm.LLMError as e:
        raise HTTPException(503, str(e))
    questions = [q for q in data.get("questions", []) if len(q.get("choices", [])) == 4]
    if not questions:
        raise HTTPException(502, "Quiz generation returned no usable questions.")
    return {"questions": questions}


@router.post("/submit")
def submit_quiz(req: SubmitRequest) -> dict:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO quiz_results (subject, topic, score, total) VALUES (?, ?, ?, ?)",
            (req.subject, req.topic or "mixed", min(req.score, req.total), req.total),
        )
    return {"ok": True}
