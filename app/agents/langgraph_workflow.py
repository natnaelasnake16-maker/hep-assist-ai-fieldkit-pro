from __future__ import annotations
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from app.core.schemas import CaseContext, ChatRequest, ChatResponse, SafetyCheck
from app.core.security import redact_and_screen
from app.core.language import detect_language, extract_symptoms
from app.core.prompts import prompt_registry
from app.core.llm_gateway import get_llm_provider
from app.rag.vector_store import vector_rag
from app.graph.clinical_graph import clinical_graph, URGENCY_RANK
from app.core.storage import log_interaction, add_review

@dataclass
class AgentState:
    request: ChatRequest
    sanitized_message: str = ""
    language: str = "en"
    symptoms: List[str] = field(default_factory=list)
    evidence: List[Any] = field(default_factory=list)
    graph_findings: List[Any] = field(default_factory=list)
    urgency: str = "routine"
    actions: List[str] = field(default_factory=list)
    missing_questions: List[str] = field(default_factory=list)
    safety: SafetyCheck = field(default_factory=SafetyCheck)
    answer: str = ""
    model_provider: str = "offline_rules"
    prompt_version: str = ""
    review_required: bool = False
    latency_ms: int = 0

class InternalWorkflowRunner:
    """Dependency-free runner with the same node boundaries as the LangGraph version.

    If `langgraph` is installed, this file can be extended to compile StateGraph.
    The explicit node methods are intentionally named to show the production agent design.
    """
    def run(self, request: ChatRequest) -> ChatResponse:
        start = time.perf_counter()
        state = AgentState(request=request)
        for node in [
            self.redact_pii_node,
            self.language_detection_node,
            self.case_extraction_node,
            self.vector_rag_node,
            self.graph_rag_node,
            self.missing_info_node,
            self.llm_answer_node,
            self.safety_guardrail_node,
            self.citation_verifier_node,
            self.supervisor_router_node,
        ]:
            state = node(state)
        state.latency_ms = int((time.perf_counter() - start) * 1000)
        response_payload = {
            "answer": state.answer,
            "language": state.language,
            "urgency": state.urgency,
            "recommended_actions": state.actions,
            "missing_questions": state.missing_questions,
            "evidence": [e.model_dump() for e in state.evidence],
            "graph_findings": [g.model_dump() for g in state.graph_findings],
            "safety": state.safety.model_dump(),
            "model_provider": state.model_provider,
            "prompt_version": state.prompt_version,
            "latency_ms": state.latency_ms,
            "review_required": state.review_required,
            "sanitized_message": state.sanitized_message,
        }
        log_interaction(
            state.request.session_id,
            state.sanitized_message,
            state.language,
            state.urgency,
            state.review_required,
            state.latency_ms,
            state.safety.model_dump(),
            response_payload,
        )
        return ChatResponse(
            answer=state.answer,
            language=state.language,
            urgency=state.urgency,  # type: ignore
            recommended_actions=state.actions,
            missing_questions=state.missing_questions,
            evidence=state.evidence,
            graph_findings=state.graph_findings,
            safety=state.safety,
            model_provider=state.model_provider,
            prompt_version=state.prompt_version,
            latency_ms=state.latency_ms,
            review_required=state.review_required,
            sanitized_message=state.sanitized_message,
        )

    def redact_pii_node(self, state: AgentState) -> AgentState:
        result = redact_and_screen(state.request.message)
        state.sanitized_message = result.text
        state.safety.pii_redacted = result.pii_redacted
        state.safety.prompt_injection_detected = result.prompt_injection_detected
        state.safety.warnings.extend(result.warnings)
        return state

    def language_detection_node(self, state: AgentState) -> AgentState:
        state.language = detect_language(state.sanitized_message, state.request.language)
        return state

    def case_extraction_node(self, state: AgentState) -> AgentState:
        state.symptoms = extract_symptoms(state.sanitized_message)
        if state.request.case_context:
            existing = set(state.request.case_context.symptoms)
            existing.update(state.symptoms)
            state.request.case_context.symptoms = sorted(existing)
        else:
            state.request.case_context = CaseContext(symptoms=state.symptoms)
        return state

    def vector_rag_node(self, state: AgentState) -> AgentState:
        ctx = state.request.case_context
        q_parts = [state.sanitized_message]
        if ctx:
            q_parts.extend(ctx.symptoms)
            if ctx.pregnancy_status:
                q_parts.append(ctx.pregnancy_status)
        state.evidence = vector_rag.search(" ".join(q_parts), top_k=4)
        return state

    def graph_rag_node(self, state: AgentState) -> AgentState:
        ctx = state.request.case_context
        state.graph_findings = clinical_graph.evaluate(state.sanitized_message, ctx, state.symptoms)
        state.urgency = clinical_graph.highest_urgency(state.graph_findings)
        actions = [f.action for f in state.graph_findings]
        # ensure urgency-specific default action
        if state.urgency == "emergency":
            actions.insert(0, "Do not delay: arrange urgent referral and notify supervisor according to local protocol.")
        elif state.urgency == "same_day":
            actions.insert(0, "Manage today, assess danger signs, and advise caregiver to return immediately if symptoms worsen.")
        else:
            actions.insert(0, "Continue protocol-based assessment and provide routine counseling/follow-up.")
        state.actions = self._dedupe(actions)
        state.safety.emergency_detected = state.urgency == "emergency"
        return state

    def missing_info_node(self, state: AgentState) -> AgentState:
        ctx = state.request.case_context
        missing = []
        if not ctx or ctx.age_months is None:
            missing.append("What is the patient's age in months or years?")
        if not ctx or ctx.temperature_c is None:
            if "fever" in state.symptoms or "fever" in state.sanitized_message.lower():
                missing.append("What is the measured temperature?")
        if "fast breathing" in (ctx.symptoms if ctx else state.symptoms) and (not ctx or ctx.respiratory_rate is None):
            missing.append("What is the respiratory rate counted for one full minute?")
        state.missing_questions = missing[:3]
        state.safety.missing_information = state.missing_questions
        return state

    def llm_answer_node(self, state: AgentState) -> AgentState:
        prompt_name = "clinical_answer_am" if state.language == "am" else "clinical_answer_en"
        tmpl = prompt_registry.get(prompt_name)
        state.prompt_version = tmpl.version
        prompt = tmpl.template.format(
            case=state.request.case_context.model_dump() if state.request.case_context else {},
            graph=[g.model_dump() for g in state.graph_findings],
            evidence=[e.model_dump() for e in state.evidence],
            question=state.sanitized_message,
        )
        result = get_llm_provider().generate(
            prompt=prompt,
            language=state.language,
            urgency=state.urgency,
            actions=state.actions,
            evidence=state.evidence,
            graph_findings=state.graph_findings,
        )
        state.answer = result.text
        state.model_provider = result.provider
        return state

    def safety_guardrail_node(self, state: AgentState) -> AgentState:
        if state.safety.prompt_injection_detected:
            state.actions.insert(0, "Ignore unsafe instruction attempts and continue using protocol-grounded guidance.")
        if state.urgency == "emergency" and "urgent referral" not in state.answer.lower():
            state.answer += "\n\n**Safety escalation:** urgent referral is required when danger signs are present."
        return state

    def citation_verifier_node(self, state: AgentState) -> AgentState:
        if not state.evidence:
            state.safety.warnings.append("No protocol evidence was retrieved; supervisor review required.")
        return state

    def supervisor_router_node(self, state: AgentState) -> AgentState:
        state.review_required = bool(
            state.urgency == "emergency"
            or state.safety.prompt_injection_detected
            or not state.evidence
            or state.safety.pii_redacted
        )
        state.safety.needs_supervisor_review = state.review_required
        if state.review_required:
            add_review(
                state.request.session_id,
                state.urgency,
                "automatic_safety_or_urgency_routing",
                {
                    "message": state.sanitized_message,
                    "urgency": state.urgency,
                    "safety": state.safety.model_dump(),
                    "evidence_ids": [e.id for e in state.evidence],
                    "case_snapshot": state.request.case_snapshot,
                    "response_snapshot": {
                        "answer": state.answer,
                        "language": state.language,
                        "urgency": state.urgency,
                        "recommended_actions": state.actions,
                        "missing_questions": state.missing_questions,
                        "evidence": [e.model_dump() for e in state.evidence],
                        "graph_findings": [g.model_dump() for g in state.graph_findings],
                        "safety": state.safety.model_dump(),
                        "model_provider": state.model_provider,
                        "prompt_version": state.prompt_version,
                        "latency_ms": state.latency_ms,
                        "review_required": state.review_required,
                    },
                },
            )
        return state

    @staticmethod
    def _dedupe(items: List[str]) -> List[str]:
        seen = set()
        out = []
        for item in items:
            if item not in seen:
                out.append(item)
                seen.add(item)
        return out

# Optional reference: if langgraph is installed, the same node design can be compiled into StateGraph.
def langgraph_available() -> bool:
    try:
        import langgraph  # noqa: F401
        return True
    except Exception:
        return False

workflow = InternalWorkflowRunner()
