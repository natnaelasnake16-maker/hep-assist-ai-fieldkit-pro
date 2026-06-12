from __future__ import annotations
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List
from app.core.config import PROTOCOL_DIR

@dataclass
class DocumentChunk:
    id: str
    title: str
    source: str
    text: str


def _title_from_markdown(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def chunk_text(title: str, source: str, text: str, max_chars: int = 750) -> List[DocumentChunk]:
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[DocumentChunk] = []
    buffer = ""
    for para in paras:
        candidate = (buffer + "\n\n" + para).strip() if buffer else para
        if len(candidate) <= max_chars:
            buffer = candidate
        else:
            if buffer:
                cid = hashlib.sha1((source + buffer).encode()).hexdigest()[:12]
                chunks.append(DocumentChunk(cid, title, source, buffer))
            buffer = para
    if buffer:
        cid = hashlib.sha1((source + buffer).encode()).hexdigest()[:12]
        chunks.append(DocumentChunk(cid, title, source, buffer))
    return chunks


def load_protocol_chunks(protocol_dir: Path = PROTOCOL_DIR) -> List[DocumentChunk]:
    chunks: List[DocumentChunk] = []
    for path in sorted(protocol_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        title = _title_from_markdown(text, path.stem)
        chunks.extend(chunk_text(title, str(path.relative_to(protocol_dir.parent)), text))
    return chunks
