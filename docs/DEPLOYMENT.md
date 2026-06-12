# Deployment Guide

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Docker

```bash
docker compose up --build
```

## On-prem LLM with Ollama

```bash
docker compose --profile ollama up --build
```

Then pull a model inside the Ollama container or on the host:

```bash
ollama pull llama3.1:8b
```

Set:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
```

## Production hardening checklist

- Use HTTPS behind Caddy/Nginx.
- Add authentication and role-based access.
- Store SQLite replacement in Postgres.
- Encrypt sensitive fields.
- Configure audit logs.
- Restrict CORS.
- Set up backups and log retention.
- Add monitoring: Prometheus/OpenTelemetry/Sentry.
- Clinically validate protocols and triage logic.
