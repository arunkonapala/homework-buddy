from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import llm

router = APIRouter(prefix="/api/tutor", tags=["tutor"])

TUTOR_SYSTEM = """You are Buddy, a friendly homework tutor for a 4th grader (age 9-10).
The subject for this conversation is: {subject}.

How you help:
- NEVER give the final answer to a homework problem directly. Guide step by step
  with hints and questions so the student figures it out themselves.
- Explain ideas with simple words, short sentences, and fun real-life examples
  (pizza slices, video games, sports, animals).
- Keep every reply short: 2-5 sentences, or a few small steps. One idea at a time.
- Be warm and encouraging. Celebrate effort ("Great thinking!", "You're so close!").
- If the student is wrong, never say "wrong" — say what they did well, then nudge
  them toward the fix.
- Ask one small check-in question at the end so the student stays engaged.
- Use plain text math only (like 3/4 and 2^3). No LaTeX or special symbols.
- Stay on school subjects. If asked something off-topic or not age-appropriate,
  gently steer back to homework.
- If asked about violence, weapons, adult topics, or personal/private information,
  kindly say that's not something you talk about and return to schoolwork."""


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    subject: str
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def tutor_chat(req: ChatRequest) -> ChatResponse:
    if not req.messages:
        raise HTTPException(400, "messages must not be empty")
    try:
        reply = llm.chat(
            system=TUTOR_SYSTEM.format(subject=req.subject),
            messages=[m.model_dump() for m in req.messages],
        )
    except llm.LLMError as e:
        raise HTTPException(503, str(e))
    return ChatResponse(reply=reply)
