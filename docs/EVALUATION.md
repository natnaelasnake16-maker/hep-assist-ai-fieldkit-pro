# Evaluation

The evaluation suite checks:

- urgency classification accuracy
- citation/protocol evidence coverage
- PII redaction
- supervisor review routing
- prompt-injection handling
- multilingual Amharic demo flow

Run:

```bash
python scripts/run_eval.py
```

The sample evaluation is deliberately small. Production evaluation should add:

- a clinically reviewed gold dataset
- Amharic and regional-language quality rubrics
- RAGAS or similar faithfulness metrics
- LLM-as-judge with human audit
- latency and cost benchmarking
- field feedback analysis by HEW/supervisor
