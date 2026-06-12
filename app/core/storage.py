from __future__ import annotations
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List
from app.core.config import RUNTIME_DIR

DB_PATH = RUNTIME_DIR / "fieldkit.db"

def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with _conn() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            message TEXT,
            language TEXT,
            urgency TEXT,
            review_required INTEGER,
            latency_ms INTEGER,
            safety_json TEXT,
            created_at INTEGER
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            rating INTEGER,
            message TEXT,
            note TEXT,
            created_at INTEGER
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS review_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            urgency TEXT,
            reason TEXT,
            payload_json TEXT,
            status TEXT DEFAULT 'open',
            created_at INTEGER
        )
        """)

def log_interaction(session_id: str | None, message: str, language: str, urgency: str, review_required: bool, latency_ms: int, safety: Dict[str, Any]) -> None:
    init_db()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO interactions(session_id,message,language,urgency,review_required,latency_ms,safety_json,created_at) VALUES(?,?,?,?,?,?,?,?)",
            (session_id, message, language, urgency, int(review_required), latency_ms, json.dumps(safety), int(time.time())),
        )

def add_review(session_id: str | None, urgency: str, reason: str, payload: Dict[str, Any]) -> None:
    init_db()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO review_queue(session_id,urgency,reason,payload_json,status,created_at) VALUES(?,?,?,?,?,?)",
            (session_id, urgency, reason, json.dumps(payload), "open", int(time.time())),
        )

def list_reviews(limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    with _conn() as conn:
        rows = conn.execute("SELECT * FROM review_queue WHERE status='open' ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) | {"payload": json.loads(r["payload_json"])} for r in rows]

def add_feedback(session_id: str | None, rating: int, message: str, note: str | None) -> None:
    init_db()
    with _conn() as conn:
        conn.execute("INSERT INTO feedback(session_id,rating,message,note,created_at) VALUES(?,?,?,?,?)", (session_id, rating, message, note, int(time.time())))
        if rating <= 3:
            add_review(session_id, "routine", "low_feedback_rating", {"rating": rating, "message": message, "note": note})

def dashboard_metrics() -> Dict[str, Any]:
    init_db()
    with _conn() as conn:
        urgency_rows = conn.execute("SELECT urgency, COUNT(*) as n FROM interactions GROUP BY urgency").fetchall()
        feedback_rows = conn.execute("SELECT COUNT(*) as n, AVG(rating) as avg_rating FROM feedback").fetchone()
        open_reviews = conn.execute("SELECT COUNT(*) as n FROM review_queue WHERE status='open'").fetchone()["n"]
        safety_flags = 0
        rows = conn.execute("SELECT safety_json FROM interactions").fetchall()
        for r in rows:
            try:
                s = json.loads(r["safety_json"])
                if s.get("pii_redacted") or s.get("prompt_injection_detected") or s.get("emergency_detected"):
                    safety_flags += 1
            except Exception:
                pass
    return {
        "urgency_distribution": {r["urgency"]: r["n"] for r in urgency_rows},
        "feedback_count": feedback_rows["n"] or 0,
        "avg_feedback": round(feedback_rows["avg_rating"] or 0, 2),
        "open_reviews": open_reviews,
        "safety_flags": safety_flags,
    }
