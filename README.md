# 🚀 Homework Buddy

An AI-powered homework helper and learning app for 4th graders, built with **FastAPI + Claude** on the backend and **Angular 20** on the frontend.

## Features

- **🧑‍🏫 AI Tutor Chat** — a kid-friendly tutor (per subject: Math, Science, English, Social Studies) that guides step by step and never just gives the answer.
- **📝 Practice Quizzes** — AI-generated multiple-choice quizzes for any topic, with instant feedback and explanations that teach.
- **🃏 Flashcards** — AI-generated flashcards with a Leitner-box rotation: missed cards come back sooner, mastered cards retire.
- **⭐ Progress Tracking** — per-subject averages, day streak, recent quizzes, and "practice these next" weak-topic hints for parents.

## Architecture

```
frontend (Angular 20, :4200) ──proxy /api──▶ backend (FastAPI, :8010) ──▶ Claude API (claude-opus-4-8)
                                                    │                       └─ or Groq (llama-3.3-70b) fallback
                                                    └──▶ SQLite (quiz results + flashcards)
```

The LLM provider is chosen automatically at runtime: **Claude** when `ANTHROPIC_API_KEY` is set (preferred — structured outputs guarantee valid quiz JSON), otherwise **Groq** when `GROQ_API_KEY` is set.

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env      # then add ANTHROPIC_API_KEY or GROQ_API_KEY
.venv/bin/uvicorn app.main:app --port 8010
```

### Frontend

```bash
cd frontend
npm install
npm start                  # serves http://localhost:4200, proxies /api to :8010
```

Open **http://localhost:4200** and pick a subject 🎈

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Health + active LLM provider |
| `/api/tutor/chat` | POST | Socratic tutor chat |
| `/api/quiz/generate` | POST | Generate an MCQ quiz (structured JSON output) |
| `/api/quiz/submit` | POST | Record a quiz score |
| `/api/flashcards/generate` | POST | Generate and store flashcards |
| `/api/flashcards/review` | GET | Cards due for review (Leitner order) |
| `/api/flashcards/{id}/answer` | POST | Record card result, move between boxes |
| `/api/progress` | GET | Stats, streak, weak topics |

## Kid-safety design

- The tutor system prompt enforces hints-not-answers, simple language, encouragement, and refusal of off-topic/inappropriate requests.
- All quiz/flashcard content is constrained to 4th-grade curriculum level.
- No accounts, no personal data collected; everything stays in a local SQLite file.
