from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.rag.ingestion import load_protocol_chunks

if __name__ == "__main__":
    chunks = load_protocol_chunks()
    print(f"Loaded {len(chunks)} protocol chunks")
    for c in chunks:
        print(f"- {c.id} | {c.title} | {c.source}")
