from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.eval.evaluator import fieldkit_evaluator
import json

if __name__ == "__main__":
    result = fieldkit_evaluator.run()
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))
    if result.failures:
        raise SystemExit(1)
