from app.core.security import redact_and_screen
from app.core.language import detect_language
from app.graph.clinical_graph import clinical_graph
from app.core.schemas import CaseContext
from app.rag.vector_store import vector_rag


def test_pii_redaction():
    r = redact_and_screen("Call 0912345678, child has fever")
    assert r.pii_redacted is True
    assert "[REDACTED_PHONE]" in r.text


def test_language_detection_amharic():
    assert detect_language("ልጅ ትኩሳት አለው") == "am"


def test_graph_rag_fast_breathing_child():
    findings = clinical_graph.evaluate("fever and fast breathing", CaseContext(age_months=36, respiratory_rate=56, symptoms=["fever", "fast breathing"]))
    assert clinical_graph.highest_urgency(findings) == "same_day"


def test_graph_rag_pregnancy_bleeding():
    findings = clinical_graph.evaluate("bleeding", CaseContext(pregnancy_status="pregnant", symptoms=["bleeding"]))
    assert clinical_graph.highest_urgency(findings) == "emergency"


def test_graph_rag_vomiting_everything_is_emergency():
    findings = clinical_graph.evaluate("child is vomiting everything", CaseContext(age_months=24, symptoms=["vomiting everything"]))
    assert clinical_graph.highest_urgency(findings) == "emergency"


def test_graph_rag_pregnancy_headache_same_day():
    findings = clinical_graph.evaluate("pregnant woman with severe headache", CaseContext(age_months=240, pregnancy_status="pregnant", symptoms=["severe headache"]))
    assert clinical_graph.highest_urgency(findings) == "same_day"


def test_vector_rag_returns_evidence():
    results = vector_rag.search("pneumonia fast breathing child")
    assert results
    assert any("Pneumonia" in r.title or "pneumonia" in r.text.lower() for r in results)
