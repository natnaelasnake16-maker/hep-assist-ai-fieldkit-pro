from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.agents.langgraph_workflow import workflow
from app.core.schemas import ChatRequest, CaseContext

req = ChatRequest(
    message="A 3 year old child has fever and fast breathing. What should I do?",
    language="en",
    case_context=CaseContext(age_months=36, temperature_c=39.2, respiratory_rate=56, symptoms=["fever", "fast breathing"]),
)
res = workflow.run(req)
print(res.model_dump_json(indent=2))
