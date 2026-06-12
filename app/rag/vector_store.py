from __future__ import annotations
import math
import re
from collections import Counter
from typing import List
from app.core.schemas import EvidenceChunk
from app.rag.ingestion import DocumentChunk, load_protocol_chunks

TOKEN_RE = re.compile(r"[\w\u1200-\u137F]+")

SYNONYMS = {
    "ትኩሳት": "fever",
    "ሳል": "cough",
    "ትንፋሽ": "breathing",
    "fast": "fast",
    "rapid": "fast",
    "difficulty": "breathing",
    "pneumonia": "pneumonia",
    "pregnant": "pregnancy",
    "pregnancy": "pregnancy",
    "bleeding": "bleeding",
    "convulsion": "convulsion",
    "convulsions": "convulsion",
}

def tokenize(text: str) -> list[str]:
    tokens = [t.lower() for t in TOKEN_RE.findall(text)]
    normalized = [SYNONYMS.get(t, t) for t in tokens]
    return normalized

class SimpleVectorRAG:
    """Small dependency-free vector-style retriever.

    It uses TF-IDF-like cosine scoring so the project runs offline without heavy dependencies.
    Optional production adapter scaffolds are provided separately for Chroma/Qdrant.
    """
    def __init__(self, chunks: List[DocumentChunk] | None = None) -> None:
        self.chunks = chunks or load_protocol_chunks()
        self.doc_tokens = [Counter(tokenize(c.text + " " + c.title)) for c in self.chunks]
        self.df = Counter()
        for c in self.doc_tokens:
            for t in c:
                self.df[t] += 1
        self.n = max(len(self.doc_tokens), 1)

    def _tfidf(self, counts: Counter) -> dict[str, float]:
        vec = {}
        for token, tf in counts.items():
            idf = math.log((1 + self.n) / (1 + self.df[token])) + 1
            vec[token] = tf * idf
        return vec

    @staticmethod
    def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
        dot = sum(a.get(k, 0) * b.get(k, 0) for k in a)
        na = math.sqrt(sum(v*v for v in a.values())) or 1
        nb = math.sqrt(sum(v*v for v in b.values())) or 1
        return dot / (na * nb)

    def search(self, query: str, top_k: int = 4) -> List[EvidenceChunk]:
        qvec = self._tfidf(Counter(tokenize(query)))
        scored = []
        for chunk, counts in zip(self.chunks, self.doc_tokens):
            score = self._cosine(qvec, self._tfidf(counts))
            if score > 0:
                scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, chunk in scored[:top_k]:
            results.append(EvidenceChunk(id=chunk.id, title=chunk.title, source=chunk.source, text=chunk.text[:700], score=round(score, 4)))
        if not results and self.chunks:
            for chunk in self.chunks[:top_k]:
                results.append(EvidenceChunk(id=chunk.id, title=chunk.title, source=chunk.source, text=chunk.text[:700], score=0.0))
        return results

vector_rag = SimpleVectorRAG()
