from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Optional
from app.core.schemas import CaseContext, GraphFinding, Urgency

@dataclass(frozen=True)
class GraphRule:
    signal: str
    keywords: List[str]
    urgency: Urgency
    reason: str
    action: str
    min_age_months: Optional[int] = None
    max_age_months: Optional[int] = None

GRAPH_RULES: List[GraphRule] = [
    GraphRule("convulsion", ["convulsion", "fits", "seizure"], "emergency", "Convulsion is a general danger sign.", "Urgent referral after pre-referral care according to protocol."),
    GraphRule("lethargy", ["lethargy", "unconscious", "very sleepy"], "emergency", "Lethargy or unconsciousness is a general danger sign.", "Urgent referral and supervisor notification."),
    GraphRule("unable_to_drink", ["unable to drink", "unable to breastfeed", "not breastfeeding"], "emergency", "Unable to drink or breastfeed is a danger sign.", "Urgent referral and immediate stabilization."),
    GraphRule("vomiting_everything", ["vomiting everything", "vomits everything", "persistent vomiting"], "emergency", "Vomiting everything is a general danger sign.", "Urgent referral and protect airway and hydration according to protocol."),
    GraphRule("chest_indrawing", ["chest indrawing", "severe chest indrawing"], "emergency", "Chest indrawing can indicate severe pneumonia.", "Urgent referral if severe or accompanied by danger signs."),
    GraphRule("pregnancy_bleeding", ["pregnancy bleeding", "pregnant bleeding", "bleeding in pregnancy", "bleeding during pregnancy"], "emergency", "Bleeding during pregnancy is a maternal danger sign.", "Urgent maternal referral and notify supervisor."),
    GraphRule("pregnancy_severe_headache", ["severe headache", "bad headache", "pregnancy headache"], "same_day", "Severe headache in pregnancy needs same-day assessment for hypertensive disease.", "Check blood pressure if available, assess other danger signs, and arrange same-day maternal review."),
    GraphRule("reduced_fetal_movement", ["reduced fetal movement", "baby not moving", "less fetal movement"], "same_day", "Reduced fetal movement needs urgent same-day maternal assessment.", "Arrange same-day maternal review and referral if movement is absent or other danger signs are present."),
    GraphRule("severe_dehydration", ["severe dehydration", "sunken eyes", "skin pinch"], "emergency", "Severe dehydration requires urgent management.", "Urgent referral and rehydration per protocol."),
    GraphRule("fast_breathing_child", ["fast breathing", "rapid breathing", "breathing difficulty"], "same_day", "Fast breathing with cough/fever suggests pneumonia risk in children.", "Assess respiratory rate by age, treat/refer according to IMCI, and advise same-day management.", min_age_months=2, max_age_months=59),
    GraphRule("young_infant_fever", ["fever", "hot body"], "emergency", "Fever in a young infant is high risk.", "Urgent assessment/referral for young infant fever.", min_age_months=0, max_age_months=2),
    GraphRule("fever_child", ["fever", "hot body"], "same_day", "Fever requires same-day assessment for danger signs, malaria risk, and infection.", "Assess danger signs, temperature, hydration, and local fever protocol."),
    GraphRule("cough", ["cough"], "routine", "Cough without danger signs requires assessment for duration and breathing difficulty.", "Ask about duration, fast breathing, chest indrawing, and fever."),
]

URGENCY_RANK = {"routine": 1, "same_day": 2, "emergency": 3}

class ClinicalGraphRAG:
    def rules_packet(self) -> List[Dict[str, object]]:
        return [r.__dict__ for r in GRAPH_RULES]

    def evaluate(self, text: str, context: CaseContext | None = None, symptoms: List[str] | None = None) -> List[GraphFinding]:
        lowered = text.lower()
        # Simple negation handling for common field phrasing.
        for negated in ["no fever", "without fever", "no fast breathing", "no breathing difficulty", "no bleeding", "no convulsion", "no convulsions"]:
            lowered = lowered.replace(negated, "")
        if symptoms:
            lowered += " " + " ".join(symptoms).lower()
        if context and context.symptoms:
            lowered += " " + " ".join(context.symptoms).lower()
        if context and context.pregnancy_status and context.pregnancy_status.lower() in {"pregnant", "yes"} and "bleeding" in lowered:
            lowered += " pregnancy bleeding"
        findings: List[GraphFinding] = []
        for rule in GRAPH_RULES:
            if context and context.age_months is not None:
                if rule.min_age_months is not None and context.age_months < rule.min_age_months:
                    continue
                if rule.max_age_months is not None and context.age_months > rule.max_age_months:
                    continue
            if any(k in lowered for k in rule.keywords):
                findings.append(GraphFinding(signal=rule.signal, urgency=rule.urgency, reason=rule.reason, action=rule.action))
        # respiratory rate override for child 2-59m
        if context and context.age_months is not None and context.respiratory_rate is not None:
            if 2 <= context.age_months <= 11 and context.respiratory_rate >= 50:
                findings.append(GraphFinding(signal="rr_fast_2_11m", urgency="same_day", reason="Respiratory rate is fast for age 2-11 months.", action="Manage as suspected pneumonia per IMCI and assess danger signs."))
            if 12 <= context.age_months <= 59 and context.respiratory_rate >= 40:
                findings.append(GraphFinding(signal="rr_fast_12_59m", urgency="same_day", reason="Respiratory rate is fast for age 12-59 months.", action="Manage as suspected pneumonia per IMCI and assess danger signs."))
        return self._dedupe(findings)

    @staticmethod
    def _dedupe(findings: List[GraphFinding]) -> List[GraphFinding]:
        seen = set()
        out = []
        for f in findings:
            if f.signal not in seen:
                out.append(f)
                seen.add(f.signal)
        return out

    def highest_urgency(self, findings: List[GraphFinding]) -> Urgency:
        if not findings:
            return "routine"
        return max((f.urgency for f in findings), key=lambda u: URGENCY_RANK[u])  # type: ignore

clinical_graph = ClinicalGraphRAG()
