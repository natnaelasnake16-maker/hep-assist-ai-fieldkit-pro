from __future__ import annotations
from typing import Dict, Any

class DHIS2PreviewAdapter:
    def build_event_payload(self, case: Dict[str, Any], urgency: str) -> Dict[str, Any]:
        return {
            "program": "HEP_ASSIST_DEMO_PROGRAM",
            "orgUnit": case.get("location") or "DEMO_WOREDA",
            "eventDate": "<client-generated-date>",
            "status": "ACTIVE",
            "dataValues": [
                {"dataElement": "AGE_MONTHS", "value": case.get("age_months")},
                {"dataElement": "SYMPTOMS", "value": ",".join(case.get("symptoms", []))},
                {"dataElement": "URGENCY", "value": urgency},
            ],
            "note": "Preview only. Do not send patient data without approved DHIS2 mapping and data sharing agreement.",
        }

dhis2_adapter = DHIS2PreviewAdapter()
