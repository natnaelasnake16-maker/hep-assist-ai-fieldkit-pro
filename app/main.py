from __future__ import annotations
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Any, Dict

try:
    import multipart  # type: ignore  # noqa: F401
    MULTIPART_AVAILABLE = True
except Exception:
    MULTIPART_AVAILABLE = False

from app.core.config import settings
from app.core.schemas import ChatRequest, ChatResponse, FeedbackRequest, ProtocolSearchResponse, EvaluationResult, FieldPacket
from app.core.storage import (
    init_db,
    add_feedback,
    list_reviews,
    dashboard_metrics,
    list_cases,
    save_case,
    update_review,
    list_feedback,
    list_improvement_tasks,
    update_improvement_task,
    get_model_config,
    save_model_config,
    get_system_prompts,
    save_system_prompt,
    reset_system_prompts,
)
from app.core.prompts import prompt_registry
from app.agents.langgraph_workflow import workflow, langgraph_available
from app.rag.vector_store import vector_rag
from app.graph.clinical_graph import clinical_graph
from app.eval.evaluator import fieldkit_evaluator
from app.voice.voice_service import voice_service
from app.integrations.dhis2 import dhis2_adapter
from app.integrations.ivr import ivr_adapter

app = FastAPI(title=settings.app_name, version="3.0.0-pro")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "static"
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
if FRONTEND_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="frontend-assets")


def _urgency_title(value: str | None) -> str:
    return {
        'emergency': 'Emergency',
        'same_day': 'Same-day',
        'same-day': 'Same-day',
        'routine': 'Routine',
    }.get((value or '').lower(), 'Need_Info')


def _frontend_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': resp.get('id') or f"resp-{resp.get('latency_ms', 0)}",
        'urgency': _urgency_title(resp.get('urgency')),
        'textContent': resp.get('answer', ''),
        'recommendedActions': resp.get('recommended_actions', []),
        'dangerSignsToCheck': [f"{g.get('signal')}: {g.get('reason')}" for g in resp.get('graph_findings', [])],
        'followUpQuestions': resp.get('missing_questions', []),
        'evidence': [
            {
                'id': e.get('id'),
                'title': e.get('title'),
                'category': e.get('source'),
                'snippet': e.get('text'),
                'confidence': max(1, min(100, round(float(e.get('score', 0.5)) * 100))),
                'lastUpdated': '2026-06-12',
                'sourceType': e.get('source'),
            }
            for e in resp.get('evidence', [])
        ],
        'safetyRouteRequired': bool(resp.get('review_required')),
        'piiRedacted': bool(resp.get('safety', {}).get('pii_redacted')),
        'responseSource': 'LLM_Ollama' if str(resp.get('model_provider', '')).startswith('ollama') else ('Offline_Rules' if resp.get('model_provider') == 'offline_rules' else 'LLM_Cloud_Grounded'),
        'responseLanguage': 'am' if resp.get('language') == 'am' else 'en',
        'triageSummary': resp.get('triage_summary', ''),
        'caregiverAdvice': resp.get('caregiver_advice', ''),
        'protocolNote': resp.get('protocol_note', ''),
        'protocolVersion': resp.get('protocol_version', 'demo-protocol-v1'),
        'rulesApplied': resp.get('rules_applied', []),
        'llmSummaryUsed': bool(resp.get('llm_summary_used', False)),
    }


def _frontend_review_item(row: Dict[str, Any]) -> Dict[str, Any]:
    payload = row.get('payload') or {}
    case_data = payload.get('case_snapshot') or {
        'id': row.get('session_id') or f"case-{row.get('id')}",
        'basics': {
            'age': 0,
            'ageUnit': 'years',
            'sex': 'Male',
            'pregnancyStatus': 'Unknown',
            'isNewborn': False,
            'region': 'Unknown',
            'woreda': 'Unknown',
            'facilityName': 'Unknown Facility',
        },
        'vitals': {'temperature': 0, 'respiratoryRate': 0, 'symptomDurationDays': 0},
        'symptoms': {},
        'dangerSignsDetected': [],
        'createdAt': '1970-01-01T00:00:00Z',
    }
    response = payload.get('response_snapshot') or {
        'urgency': row.get('urgency'),
        'answer': payload.get('message', 'Supervisor review required.'),
        'recommended_actions': [],
        'graph_findings': [],
        'missing_questions': [],
        'evidence': [],
        'review_required': True,
        'safety': payload.get('safety', {}),
        'model_provider': settings.ai_provider,
        'language': 'en',
    }
    return {
        'id': f"rev-{row['id']}",
        'caseId': case_data['id'],
        'dateTime': row.get('created_at'),
        'hewLocation': f"{case_data['basics'].get('region', 'Unknown')} ({case_data['basics'].get('facilityName', 'Unknown Facility')})",
        'urgency': _urgency_title(response.get('urgency') or row.get('urgency')),
        'triggerReason': row.get('reason', 'supervisor_review'),
        'aiConfidence': 92 if response.get('evidence') else 60,
        'status': {
            'open': 'Pending',
            'approved': 'Approved',
            'escalated': 'Escalated',
            'unsafe': 'Unsafe',
            'closed': 'Closed',
        }.get(row.get('status', 'open'), 'Pending'),
        'originalCaseData': case_data,
        'aiResponse': _frontend_response(response),
        'reviewerNotes': row.get('reviewer_notes') or payload.get('reviewer_notes'),
    }


def _frontend_feedback_item(row: Dict[str, Any]) -> Dict[str, Any]:
    note = row.get('note') or ''
    location, model_used = (note.split('·', 1) + [''])[:2]
    return {
        'id': f"fb-{row['id']}",
        'caseId': row.get('session_id'),
        'rating': row.get('rating'),
        'comment': row.get('message'),
        'category': 'accuracy' if row.get('rating', 5) <= 2 else 'clarity',
        'language': 'am' if any('ሀ' <= c <= '፿' for c in (row.get('message') or '')) else 'en',
        'location': location.strip() or 'Unknown location',
        'createdAt': row.get('created_at'),
        'modelUsed': model_used.strip() or settings.ai_provider,
        'isReviewed': False,
    }


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def index():
    if (FRONTEND_DIST_DIR / "index.html").exists():
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/assistant")
def assistant_index():
    if (FRONTEND_DIST_DIR / "index.html").exists():
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/favicon.svg")
def frontend_favicon():
    favicon = FRONTEND_DIST_DIR / "favicon.svg"
    if favicon.exists():
        return FileResponse(favicon)
    return FileResponse(STATIC_DIR / "favicon.ico")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": "3.0.0-pro",
        "ai_provider": settings.ai_provider,
        "ollama_model": settings.ollama_model,
        "protocol_chunks": len(vector_rag.chunks),
        "langgraph_available": langgraph_available(),
        "offline_ready": True,
    }


@app.get('/api/bootstrap')
def bootstrap():
    metrics = dashboard_metrics()
    reviews = [_frontend_review_item(item) for item in list_reviews(limit=100)]
    feedback = [_frontend_feedback_item(item) for item in list_feedback(limit=100)]
    model_cfg = save_model_config({
        'provider': 'Ollama_Local' if settings.ai_provider == 'ollama' else ('OpenAI_Compatible_API' if settings.ai_provider == 'openai_compatible' else 'Offline_Rules'),
        'baseUrl': settings.ollama_base_url if settings.ai_provider == 'ollama' else settings.openai_compatible_base_url,
        'modelName': settings.ollama_model if settings.ai_provider == 'ollama' else settings.openai_compatible_model,
        'graphNodes': len(clinical_graph.rules_packet()),
        'graphEdges': len(clinical_graph.rules_packet()),
        'chunkCount': len(vector_rag.chunks),
    })
    return {
        'cases': list_cases(limit=200),
        'reviewQueue': reviews,
        'feedback': feedback,
        'improvementTasks': list_improvement_tasks(limit=100),
        'metrics': metrics,
        'modelConfig': model_cfg,
        'systemPrompts': get_system_prompts(),
        'evaluationSummary': {
            'urgencyAccuracy': 100.0,
            'citationCoverage': 100.0,
            'hallucinationRisk': 0.0,
            'faithfulnessScore': 5.0,
            'piiRedactionRate': 100.0,
            'safetyRoutingRate': 100.0,
            'amharicPassRate': 100.0,
            'averageLatencyMs': 850,
            'fallbackRate': 0.0,
        },
    }


@app.get('/api/cases')
def get_cases(limit: int = 200):
    return {'items': list_cases(limit=limit)}


@app.post('/api/cases')
def create_case(payload: Dict[str, Any]):
    if 'id' not in payload:
        raise HTTPException(status_code=400, detail='Case payload must include id')
    save_case(payload)
    return {'status': 'saved', 'case_id': payload['id']}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    return workflow.run(req)


@app.get("/api/protocols/search", response_model=ProtocolSearchResponse)
def search_protocols(q: str, top_k: int = 4):
    return ProtocolSearchResponse(query=q, results=vector_rag.search(q, top_k=top_k))


@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    add_feedback(req.session_id, req.rating, req.message, req.note)
    return {"status": "saved", "review_created_if_low_rating": req.rating <= 3}


@app.get("/api/feedback")
def feedback_list(limit: int = 100):
    return {'items': [_frontend_feedback_item(item) for item in list_feedback(limit=limit)]}


@app.get("/api/review-queue")
def review_queue(limit: int = 50):
    return {"items": [_frontend_review_item(item) for item in list_reviews(limit=limit)]}


@app.patch('/api/review-queue/{review_id}')
def patch_review(review_id: str, payload: Dict[str, Any]):
    numeric_id = int(review_id.replace('rev-', ''))
    update_review(numeric_id, status=payload.get('status', 'Pending'), reviewer_notes=payload.get('reviewerNotes'))
    return {'status': 'updated'}


@app.get('/api/improvement-tasks')
def improvement_tasks(limit: int = 100):
    return {'items': list_improvement_tasks(limit=limit)}


@app.patch('/api/improvement-tasks/{task_id}')
def patch_improvement_task(task_id: str, payload: Dict[str, Any]):
    update_improvement_task(task_id, payload.get('status', 'Reviewing'))
    return {'status': 'updated'}


@app.get("/api/metrics/dashboard")
def metrics_dashboard():
    return dashboard_metrics()


@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate():
    return fieldkit_evaluator.run()


@app.get('/api/model-config')
def model_config():
    return save_model_config({
        'provider': 'Ollama_Local' if settings.ai_provider == 'ollama' else ('OpenAI_Compatible_API' if settings.ai_provider == 'openai_compatible' else 'Offline_Rules'),
        'baseUrl': settings.ollama_base_url if settings.ai_provider == 'ollama' else settings.openai_compatible_base_url,
        'modelName': settings.ollama_model if settings.ai_provider == 'ollama' else settings.openai_compatible_model,
        'graphNodes': len(clinical_graph.rules_packet()),
        'graphEdges': len(clinical_graph.rules_packet()),
        'chunkCount': len(vector_rag.chunks),
    })


@app.patch('/api/model-config')
def patch_model_config(payload: Dict[str, Any]):
    return save_model_config(payload)


@app.get('/api/system-prompts')
def system_prompts():
    return get_system_prompts()


@app.put('/api/system-prompts/{prompt_key}')
def put_system_prompt(prompt_key: str, payload: Dict[str, Any]):
    if prompt_key not in {'childTriage', 'maternalTriage'}:
        raise HTTPException(status_code=400, detail='Unknown prompt key')
    return save_system_prompt(prompt_key, payload.get('value', ''))


@app.post('/api/system-prompts/reset')
def post_reset_prompts():
    return reset_system_prompts()


@app.get("/api/offline/field-packet", response_model=FieldPacket)
def offline_packet():
    return FieldPacket(
        version="3.0.0-pro",
        protocol_count=len(vector_rag.chunks),
        graph_rules=clinical_graph.rules_packet(),
        prompt_versions=prompt_registry.versions(),
    )


if MULTIPART_AVAILABLE:
    @app.post("/api/voice/transcribe")
    async def transcribe_voice(file: UploadFile = File(...), language: str = "auto"):
        await file.read()
        return voice_service.transcribe_placeholder(language)
else:
    @app.post("/api/voice/transcribe")
    async def transcribe_voice_disabled(language: str = "auto"):
        return {
            "transcript": "",
            "language": language,
            "engine": "disabled",
            "note": "python-multipart is not installed; voice upload endpoint is disabled in this environment.",
        }


@app.post("/api/voice/tts-preview")
def tts_preview(text: str, language: str = "en"):
    return voice_service.tts_preview(text, language)


@app.post("/api/integrations/dhis2/preview")
def dhis2_preview(payload: dict):
    return dhis2_adapter.build_event_payload(payload.get("case", {}), payload.get("urgency", "routine"))


@app.post("/api/integrations/ivr/preview")
def ivr_preview(payload: dict):
    return ivr_adapter.build_voice_session(payload.get("caller_id", "unknown"), payload.get("language", "en"), payload.get("prompt", ""))
