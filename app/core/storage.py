from __future__ import annotations
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.config import RUNTIME_DIR

DB_PATH = RUNTIME_DIR / "fieldkit.db"
STATE_PATH = RUNTIME_DIR / "state"
STATE_PATH.mkdir(exist_ok=True)
DEFAULT_MODEL_CONFIG = {
    "provider": "Ollama_Local",
    "baseUrl": "http://127.0.0.1:11434",
    "modelName": "qwen2.5:1.5b",
    "temperature": 0.15,
    "maxTokens": 700,
    "timeoutSeconds": 20,
    "fallbackEnabled": True,
    "chunkCount": 4,
    "embeddingModel": "local-protocol-index",
    "vectorDbStatus": "ready",
    "graphNodes": 0,
    "graphEdges": 0,
}
DEFAULT_SYSTEM_PROMPTS = {
    "childTriage": "SYSTEM INSTRUCTION: Managing Under-5 infant fast breathing conditions. Standard IMNCI guidelines dictate checking respiratory rates against age categories (2-11m >= 50, 12-59m >= 40). Flag danger signs including chest indrawing or extreme lethargy instantly. Cite exact protocol chapters.",
    "maternalTriage": "SYSTEM INSTRUCTION: Severe gestational complications guidelines. Active third trimester vaginal bleeding constitutes absolute emergency. Establish left lateral posture, arrange prompt high-risk referral transfer, notify supervisor queue.",
}


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
    cols = {row['name'] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


def _load_json_file(path: Path, default: Dict[str, Any]) -> Dict[str, Any]:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            pass
    path.write_text(json.dumps(default, indent=2))
    return dict(default)


def _save_json_file(path: Path, payload: Dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2))


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
            response_json TEXT,
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
            reviewer_notes TEXT,
            created_at INTEGER
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            created_at INTEGER
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS improvement_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            source_feedback_id TEXT NOT NULL,
            created_at INTEGER
        )
        """)
        _ensure_column(conn, 'interactions', 'response_json', 'TEXT')
        _ensure_column(conn, 'review_queue', 'reviewer_notes', 'TEXT')


def log_interaction(session_id: Optional[str], message: str, language: str, urgency: str, review_required: bool, latency_ms: int, safety: Dict[str, Any], response_payload: Optional[Dict[str, Any]] = None) -> None:
    init_db()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO interactions(session_id,message,language,urgency,review_required,latency_ms,safety_json,response_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (session_id, message, language, urgency, int(review_required), latency_ms, json.dumps(safety), json.dumps(response_payload or {}), int(time.time())),
        )


def save_case(case_payload: Dict[str, Any]) -> None:
    init_db()
    case_id = str(case_payload['id'])
    created_at = int(time.time())
    with _conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cases(id,payload_json,created_at) VALUES(?,?,COALESCE((SELECT created_at FROM cases WHERE id=?),?))",
            (case_id, json.dumps(case_payload), case_id, created_at),
        )


def list_cases(limit: int = 200) -> List[Dict[str, Any]]:
    init_db()
    with _conn() as conn:
        rows = conn.execute("SELECT payload_json FROM cases ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [json.loads(r['payload_json']) for r in rows]


def get_latest_response(session_id: Optional[str]) -> Dict[str, Any]:
    if not session_id:
        return {}
    init_db()
    with _conn() as conn:
        row = conn.execute(
            "SELECT response_json FROM interactions WHERE session_id=? ORDER BY created_at DESC, id DESC LIMIT 1",
            (session_id,),
        ).fetchone()
    if not row or not row['response_json']:
        return {}
    try:
        return json.loads(row['response_json'])
    except Exception:
        return {}


def add_review(session_id: Optional[str], urgency: str, reason: str, payload: Dict[str, Any]) -> None:
    init_db()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO review_queue(session_id,urgency,reason,payload_json,status,created_at) VALUES(?,?,?,?,?,?)",
            (session_id, urgency, reason, json.dumps(payload), "open", int(time.time())),
        )


def list_reviews(limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    with _conn() as conn:
        rows = conn.execute("SELECT * FROM review_queue ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) | {"payload": json.loads(r["payload_json"] or "{}")} for r in rows]


def update_review(review_id: int, *, status: str, reviewer_notes: Optional[str] = None) -> None:
    init_db()
    normalized = {
        'Pending': 'open',
        'Approved': 'approved',
        'Escalated': 'escalated',
        'Unsafe': 'unsafe',
        'Closed': 'closed',
    }.get(status, status.lower())
    with _conn() as conn:
        conn.execute(
            "UPDATE review_queue SET status=?, reviewer_notes=? WHERE id=?",
            (normalized, reviewer_notes, review_id),
        )


def add_improvement_task(*, title: str, priority: str, source_feedback_id: str) -> None:
    init_db()
    task_id = f"imp-{int(time.time() * 1000)}"
    with _conn() as conn:
        conn.execute(
            "INSERT INTO improvement_tasks(id,title,status,priority,source_feedback_id,created_at) VALUES(?,?,?,?,?,?)",
            (task_id, title, 'New', priority, source_feedback_id, int(time.time())),
        )


def list_improvement_tasks(limit: int = 100) -> List[Dict[str, Any]]:
    init_db()
    with _conn() as conn:
        rows = conn.execute("SELECT * FROM improvement_tasks ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def update_improvement_task(task_id: str, status: str) -> None:
    init_db()
    with _conn() as conn:
        conn.execute("UPDATE improvement_tasks SET status=? WHERE id=?", (status, task_id))


def add_feedback(session_id: Optional[str], rating: int, message: str, note: Optional[str]) -> None:
    init_db()
    feedback_id = None
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO feedback(session_id,rating,message,note,created_at) VALUES(?,?,?,?,?)",
            (session_id, rating, message, note, int(time.time())),
        )
        feedback_id = str(cur.lastrowid)
    if rating <= 3:
        add_review(session_id, 'routine', 'low_feedback_rating', {'rating': rating, 'message': message, 'note': note})
    if rating <= 2 and feedback_id:
        add_improvement_task(
            title=f"Review low-rated field feedback: {message[:72]}",
            priority='High' if rating == 2 else 'Critical',
            source_feedback_id=feedback_id,
        )


def list_feedback(limit: int = 100) -> List[Dict[str, Any]]:
    init_db()
    with _conn() as conn:
        rows = conn.execute("SELECT * FROM feedback ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def dashboard_metrics() -> Dict[str, Any]:
    init_db()
    with _conn() as conn:
        urgency_rows = conn.execute("SELECT urgency, COUNT(*) as n FROM interactions GROUP BY urgency").fetchall()
        feedback_rows = conn.execute("SELECT COUNT(*) as n, AVG(rating) as avg_rating FROM feedback").fetchone()
        review_rows = conn.execute("SELECT status, COUNT(*) as n FROM review_queue GROUP BY status").fetchall()
        case_count = conn.execute("SELECT COUNT(*) as n FROM cases").fetchone()['n']
        safety_flags = 0
        rows = conn.execute("SELECT safety_json FROM interactions").fetchall()
        for r in rows:
            try:
                s = json.loads(r['safety_json'])
                if s.get('pii_redacted') or s.get('prompt_injection_detected') or s.get('emergency_detected'):
                    safety_flags += 1
            except Exception:
                pass
    return {
        'urgency_distribution': {r['urgency']: r['n'] for r in urgency_rows},
        'feedback_count': feedback_rows['n'] or 0,
        'avg_feedback': round(feedback_rows['avg_rating'] or 0, 2),
        'review_status_counts': {r['status']: r['n'] for r in review_rows},
        'open_reviews': sum(r['n'] for r in review_rows if r['status'] == 'open'),
        'safety_flags': safety_flags,
        'case_count': case_count,
    }


def get_model_config() -> Dict[str, Any]:
    return _load_json_file(STATE_PATH / 'model_config.json', DEFAULT_MODEL_CONFIG)


def save_model_config(payload: Dict[str, Any]) -> Dict[str, Any]:
    current = get_model_config()
    current.update(payload)
    _save_json_file(STATE_PATH / 'model_config.json', current)
    return current


def get_system_prompts() -> Dict[str, Any]:
    return _load_json_file(STATE_PATH / 'system_prompts.json', DEFAULT_SYSTEM_PROMPTS)


def save_system_prompt(key: str, value: str) -> Dict[str, Any]:
    prompts = get_system_prompts()
    prompts[key] = value
    _save_json_file(STATE_PATH / 'system_prompts.json', prompts)
    return prompts


def reset_system_prompts() -> Dict[str, Any]:
    _save_json_file(STATE_PATH / 'system_prompts.json', DEFAULT_SYSTEM_PROMPTS)
    return dict(DEFAULT_SYSTEM_PROMPTS)
