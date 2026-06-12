# HEP Assist AI FieldKit Pro

**Offline-first multilingual AI engineering prototype for Health Extension Worker decision support.**

This project is a portfolio-grade prototype aligned to a Senior AI Engineer role focused on HEP Assist-style digital health AI systems. It demonstrates the engineering building blocks listed in the role: **LLM deployment, LangGraph-style agent workflows, vector RAG, Graph RAG, prompt engineering, multilingual support, voice interface, offline-first behavior, feedback loops, evaluation, hallucination testing, CI/CD, Docker, and on-premise AI serving.**

> Safety note: this is **not a medical device** and is not approved for real patient care. It uses small sample protocol notes and deterministic safety rules for demonstration. Real deployment requires Ministry-approved protocols, clinical validation, data protection review, and supervised field testing.

## What this project proves

| Requirement area | Included implementation |
|---|---|
| AI assistant API | FastAPI backend with validated schemas and clinical-response contract |
| LLM deployment | Model gateway with `offline_rules`, `ollama`, and `openai_compatible` modes |
| Agentic AI / LangGraph | Node-based workflow: redaction → language → case extraction → RAG → Graph RAG → LLM → safety → citation check → review routing |
| Vector RAG | Local vector-style retriever over protocol chunks, with optional Chroma adapter scaffold |
| Graph RAG | Symptom/danger-sign/urgency/action graph for clinical routing |
| Prompt engineering | Versioned prompt registry for triage, answer generation, safety, Amharic support |
| Multilingual AI | English + Amharic language handling, Amharic demo prompts and evaluation cases |
| Voice/multimodal | Browser mic, browser read-aloud, voice endpoint scaffolds, Whisper adapter notes |
| Offline-first | Static PWA-like UI, localStorage feedback queue, offline field packet endpoint |
| Evaluation | Automated urgency accuracy, citation coverage, safety routing, PII redaction, prompt-injection tests |
| DevOps | Dockerfile, docker-compose with Ollama service profile, GitHub Actions CI |
| Observability | Metrics endpoint, latency measurement, safety flags, review queue stats |
| Field feedback | HEW feedback logging, supervisor review queue, continuous improvement loop |
| Integrations | DHIS2 preview payload, IVR/telephony preview adapter |
| Fine-tuning proof | LoRA fine-tuning script scaffold + sample instruction-tuning dataset |

## Quick start

```bash
cd hep_assist_ai_fieldkit_pro
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Run tests:

```bash
pytest -q
```

Run evaluation:

```bash
python scripts/run_eval.py
```

## AI provider modes

Copy `.env.example` to `.env` and edit:

```bash
cp .env.example .env
```

### 1) Offline deterministic mode

Good for low-resource/offline demos and tests.

```env
AI_PROVIDER=offline_rules
```

### 2) Ollama on-prem mode

Run a local model:

```bash
ollama pull llama3.1:8b
ollama serve
```

Then set:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434
```

### 3) OpenAI-compatible API mode

Works with OpenAI-compatible providers, local gateways, or internal model servers.

```env
AI_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_BASE_URL=http://localhost:8001/v1
OPENAI_COMPATIBLE_API_KEY=change-me
OPENAI_COMPATIBLE_MODEL=local-health-assistant
```

## Docker

```bash
docker compose up --build
```

With Ollama profile:

```bash
docker compose --profile ollama up --build
```

## Key flows to test

### Chat / triage

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message":"A 3 year old child has fever and fast breathing. What should the HEW do?",
    "language":"en",
    "case_context":{"age_months":36,"temperature_c":39.2,"respiratory_rate":56,"symptoms":["fever","fast breathing"]}
  }'
```

### Amharic

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"ልጅ ትኩሳት አለው እና በፍጥነት ይተነፍሳል። ምን ማድረግ አለብኝ?","language":"am"}'
```

### Protocol search

```bash
curl "http://127.0.0.1:8000/api/protocols/search?q=pneumonia%20fast%20breathing"
```

### Review queue

```bash
curl http://127.0.0.1:8000/api/review-queue
```

### Metrics

```bash
curl http://127.0.0.1:8000/api/metrics/dashboard
```

## Suggested application story

> I built an offline-first multilingual AI engineering prototype inspired by HEP Assist. It combines LangGraph-style agent orchestration, vector RAG over protocol documents, Graph RAG for danger-sign triage, local Ollama/on-prem LLM deployment, Amharic/English prompt workflows, voice interface scaffolding, PII redaction, supervisor review routing, and an evaluation suite for hallucination, citation faithfulness, urgency accuracy, safety routing, and field feedback.

## Repository structure

```text
app/
  agents/             LangGraph-style workflow
  core/               config, schemas, language, security, prompts
  rag/                ingestion, vector retriever, Chroma adapter scaffold
  graph/              clinical Graph RAG engine
  eval/               evaluation framework
  integrations/       DHIS2 and IVR preview adapters
  voice/              voice/STT/TTS scaffolds
  static/             offline-first UI
  main.py             FastAPI app
scripts/              runnable evaluation and ingestion scripts
finetuning/           LoRA fine-tuning proof and sample dataset
data/                 sample protocols and eval cases
docs/                 architecture, safety, deployment, evaluation, job alignment
tests/                automated tests
```
