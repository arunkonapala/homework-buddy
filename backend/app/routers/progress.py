from datetime import date, timedelta

from fastapi import APIRouter

from app.db import get_db

router = APIRouter(prefix="/api/progress", tags=["progress"])

WEAK_TOPIC_THRESHOLD = 0.6


@router.get("")
def get_progress() -> dict:
    with get_db() as conn:
        rows = [
            dict(r)
            for r in conn.execute(
                "SELECT subject, topic, score, total, created_at FROM quiz_results "
                "ORDER BY created_at DESC"
            ).fetchall()
        ]

    subjects: dict[str, dict] = {}
    topic_stats: dict[tuple[str, str], list[int]] = {}
    days_active: set[str] = set()

    for r in rows:
        s = subjects.setdefault(
            r["subject"], {"attempts": 0, "correct": 0, "answered": 0, "best_pct": 0}
        )
        pct = round(100 * r["score"] / r["total"])
        s["attempts"] += 1
        s["correct"] += r["score"]
        s["answered"] += r["total"]
        s["best_pct"] = max(s["best_pct"], pct)
        key = (r["subject"], r["topic"])
        topic_stats.setdefault(key, [0, 0])
        topic_stats[key][0] += r["score"]
        topic_stats[key][1] += r["total"]
        days_active.add(r["created_at"][:10])

    for s in subjects.values():
        s["avg_pct"] = round(100 * s["correct"] / s["answered"]) if s["answered"] else 0

    weak_topics = [
        {"subject": subj, "topic": topic, "pct": round(100 * c / t)}
        for (subj, topic), (c, t) in topic_stats.items()
        if t and c / t < WEAK_TOPIC_THRESHOLD
    ]

    # Streak: consecutive days with at least one quiz, counting back from today
    # (or yesterday, so an unfinished today doesn't break the streak).
    streak = 0
    day = date.today()
    if day.isoformat() not in days_active:
        day -= timedelta(days=1)
    while day.isoformat() in days_active:
        streak += 1
        day -= timedelta(days=1)

    return {
        "recent": rows[:20],
        "subjects": subjects,
        "weak_topics": sorted(weak_topics, key=lambda w: w["pct"]),
        "streak_days": streak,
        "total_quizzes": len(rows),
    }
