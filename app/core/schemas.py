from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

Language = Literal["auto", "en", "am"]
Urgency = Literal["routine", "same_day", "emergency"]

class CaseContext(BaseModel):
    age_months: Optional[int] = Field(default=None, ge=0, le=1440)
    sex: Optional[str] = None
    pregnancy_status: Optional[str] = None
    temperature_c: Optional[float] = Field(default=None, ge=30, le=45)
    respiratory_rate: Optional[int] = Field(default=None, ge=0, le=120)
    blood_pressure: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    notes: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    language: Language = "auto"
    case_context: Optional[CaseContext] = None
    user_role: str = "HEW"
    session_id: Optional[str] = None
    case_snapshot: Optional[Dict[str, Any]] = None

class EvidenceChunk(BaseModel):
    id: str
    title: str
    source: str
    text: str
    score: float

class GraphFinding(BaseModel):
    signal: str
    urgency: Urgency
    reason: str
    action: str

class SafetyCheck(BaseModel):
    pii_redacted: bool = False
    prompt_injection_detected: bool = False
    emergency_detected: bool = False
    needs_supervisor_review: bool = False
    missing_information: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class ChatResponse(BaseModel):
    answer: str
    language: str
    urgency: Urgency
    recommended_actions: List[str]
    missing_questions: List[str]
    evidence: List[EvidenceChunk]
    graph_findings: List[GraphFinding]
    safety: SafetyCheck
    model_provider: str
    prompt_version: str
    latency_ms: int
    review_required: bool
    sanitized_message: str

class FeedbackRequest(BaseModel):
    session_id: Optional[str] = None
    case_snapshot: Optional[Dict[str, Any]] = None
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=1, max_length=2000)
    note: Optional[str] = None

class ProtocolSearchResponse(BaseModel):
    query: str
    results: List[EvidenceChunk]

class EvaluationResult(BaseModel):
    total_cases: int
    urgency_accuracy: float
    citation_coverage: float
    pii_redaction_rate: float
    safety_routing_rate: float
    failures: List[Dict[str, Any]]

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    language: str
    engine: str
    note: str

class FieldPacket(BaseModel):
    version: str
    protocol_count: int
    graph_rules: List[Dict[str, Any]]
    prompt_versions: Dict[str, str]
    generated_for: str = "offline_low_bandwidth_clients"
