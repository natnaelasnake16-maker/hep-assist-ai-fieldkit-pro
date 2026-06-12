# Job Alignment: LMH Senior AI Engineer

| Job description requirement | Project evidence |
|---|---|
| HEP Assist AI platform | HEW-centered assistant and case intake workflow |
| Multilingual AI | English/Amharic detection, prompts, demo cases |
| Prompt engineering | Versioned prompt registry in `app/core/prompts.py` |
| Fine-tuning | LoRA training scaffold and JSONL dataset in `finetuning/` |
| Model evaluation | `app/eval/evaluator.py`, `scripts/run_eval.py`, `/api/evaluate` |
| RAG | `app/rag/vector_store.py` and protocol chunks |
| Graph RAG | `app/graph/clinical_graph.py` danger-sign/action graph |
| Agentic AI | `app/agents/langgraph_workflow.py` with auditable nodes |
| On-prem LLM deployment | Ollama mode and docker-compose profile |
| DevOps | Dockerfile, docker-compose, GitHub Actions CI |
| Monitoring | `/api/metrics/dashboard`, latency, safety flags |
| Field feedback | `/api/feedback` and supervisor review queue |
| Voice | browser mic UI and `/api/voice/*` endpoints |
| DHIS2/IVR | preview adapters in `app/integrations/` |
| Offline-first | static UI, offline packet endpoint, localStorage-ready UI pattern |

## Suggested CV bullet

**HEP Assist AI FieldKit Pro — Offline-first multilingual AI platform prototype for Health Extension Worker support.** Built FastAPI + LangGraph-style agent workflow with vector RAG, Graph RAG triage, Ollama/on-prem LLM gateway, Amharic/English support, PII redaction, supervisor review queue, voice interface scaffolding, DHIS2/IVR preview adapters, Docker/CI, and evaluation suite for urgency accuracy, citation coverage, safety routing, and hallucination controls.
