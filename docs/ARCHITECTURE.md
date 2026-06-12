# Architecture

The project is designed as a compact version of a production AI platform for frontline health-worker support.

## Request flow

```text
HEW UI / IVR / mobile client
  → FastAPI /api/chat
  → LangGraph-style agent workflow
  → PII redaction
  → language detection
  → case extraction
  → vector RAG protocol retrieval
  → Graph RAG triage
  → LLM gateway
  → safety guardrail
  → citation verifier
  → supervisor review router
  → response + metrics + feedback loop
```

## Why this design matches the role

- The workflow decomposes the AI behavior into auditable nodes.
- RAG retrieves grounded protocol evidence.
- Graph RAG prevents the LLM from making the clinical routing decision alone.
- LLM gateway supports offline deterministic, on-prem Ollama, and OpenAI-compatible model servers.
- Review queue and metrics connect field feedback to continuous improvement.
- Offline field packet allows low-bandwidth clients to cache protocol and rule assets.

## Production extension points

- Replace sample protocol markdown with official Ministry-approved protocol library.
- Replace SimpleVectorRAG with Chroma/Qdrant/pgvector.
- Replace internal runner with compiled LangGraph StateGraph when dependency is installed.
- Add authentication, role-based access, audit logs, and encryption.
- Add real mobile sync and conflict handling.
- Connect Whisper/TTS and IVR provider.
