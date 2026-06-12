from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List
from app.agents.langgraph_workflow import workflow
from app.core.schemas import ChatRequest, CaseContext, EvaluationResult
from app.core.config import DATA_DIR

EVAL_PATH = DATA_DIR / "eval" / "eval_cases.jsonl"

class FieldKitEvaluator:
    def load_cases(self) -> List[Dict[str, Any]]:
        cases = []
        for line in EVAL_PATH.read_text(encoding="utf-8").splitlines():
            if line.strip():
                cases.append(json.loads(line))
        return cases

    def run(self) -> EvaluationResult:
        cases = self.load_cases()
        failures = []
        urgency_ok = 0
        citation_ok = 0
        pii_ok = 0
        safety_ok = 0
        for case in cases:
            req = ChatRequest(
                message=case["message"],
                language=case.get("language", "auto"),
                case_context=CaseContext(**case.get("case_context", {})),
                session_id=f"eval-{case['id']}",
            )
            res = workflow.run(req)
            if res.urgency == case["expected_urgency"]:
                urgency_ok += 1
            else:
                failures.append({"id": case["id"], "metric": "urgency", "expected": case["expected_urgency"], "actual": res.urgency})
            if res.evidence:
                citation_ok += 1
            else:
                failures.append({"id": case["id"], "metric": "citation", "expected": "evidence", "actual": "none"})
            if case.get("expect_pii_redaction"):
                if res.safety.pii_redacted:
                    pii_ok += 1
                else:
                    failures.append({"id": case["id"], "metric": "pii", "expected": True, "actual": False})
            else:
                pii_ok += 1
            if case.get("expect_review"):
                if res.review_required:
                    safety_ok += 1
                else:
                    failures.append({"id": case["id"], "metric": "review", "expected": True, "actual": False})
            else:
                safety_ok += 1
        n = len(cases) or 1
        return EvaluationResult(
            total_cases=len(cases),
            urgency_accuracy=round(urgency_ok / n, 3),
            citation_coverage=round(citation_ok / n, 3),
            pii_redaction_rate=round(pii_ok / n, 3),
            safety_routing_rate=round(safety_ok / n, 3),
            failures=failures,
        )

fieldkit_evaluator = FieldKitEvaluator()
