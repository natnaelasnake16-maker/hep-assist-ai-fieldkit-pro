from __future__ import annotations
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.core.config import settings
from app.core.schemas import ChatRequest, ChatResponse, FeedbackRequest, ProtocolSearchResponse, EvaluationResult, FieldPacket
from app.core.storage import init_db, add_feedback, list_reviews, dashboard_metrics
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
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.on_event("startup")
def startup() -> None:
    init_db()

@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": "3.0.0-pro",
        "ai_provider": settings.ai_provider,
        "protocol_chunks": len(vector_rag.chunks),
        "langgraph_available": langgraph_available(),
        "offline_ready": True,
    }

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

@app.get("/api/review-queue")
def review_queue(limit: int = 50):
    return {"items": list_reviews(limit=limit)}

@app.get("/api/metrics/dashboard")
def metrics_dashboard():
    return dashboard_metrics()

@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate():
    return fieldkit_evaluator.run()

@app.get("/api/offline/field-packet", response_model=FieldPacket)
def offline_packet():
    return FieldPacket(
        version="3.0.0-pro",
        protocol_count=len(vector_rag.chunks),
        graph_rules=clinical_graph.rules_packet(),
        prompt_versions=prompt_registry.versions(),
    )

@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), language: str = "auto"):
    # File is accepted to prove the API contract. Real Whisper adapter is optional.
    await file.read()
    return voice_service.transcribe_placeholder(language)

@app.post("/api/voice/tts-preview")
def tts_preview(text: str, language: str = "en"):
    return voice_service.tts_preview(text, language)

@app.post("/api/integrations/dhis2/preview")
def dhis2_preview(payload: dict):
    return dhis2_adapter.build_event_payload(payload.get("case", {}), payload.get("urgency", "routine"))

@app.post("/api/integrations/ivr/preview")
def ivr_preview(payload: dict):
    return ivr_adapter.build_voice_session(payload.get("caller_id", "unknown"), payload.get("language", "en"), payload.get("prompt", ""))
