"""Optional Chroma adapter scaffold.

Install `chromadb` and `sentence-transformers` from requirements-ai-optional.txt to use this in a heavier demo.
The default app uses the dependency-free SimpleVectorRAG so it runs offline and in CI.
"""
from __future__ import annotations
from typing import List
from app.core.schemas import EvidenceChunk
from app.rag.ingestion import load_protocol_chunks

class ChromaRAGAdapter:
    def __init__(self, persist_directory: str = "runtime/chroma") -> None:
        try:
            import chromadb  # type: ignore
            from sentence_transformers import SentenceTransformer  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Install requirements-ai-optional.txt to use ChromaRAGAdapter") from exc
        self.chromadb = chromadb
        self.model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection("protocols")

    def ingest(self) -> None:
        chunks = load_protocol_chunks()
        if not chunks:
            return
        embeddings = self.model.encode([c.text for c in chunks]).tolist()
        self.collection.upsert(
            ids=[c.id for c in chunks],
            documents=[c.text for c in chunks],
            embeddings=embeddings,
            metadatas=[{"title": c.title, "source": c.source} for c in chunks],
        )

    def search(self, query: str, top_k: int = 4) -> List[EvidenceChunk]:
        emb = self.model.encode([query]).tolist()[0]
        result = self.collection.query(query_embeddings=[emb], n_results=top_k)
        out: List[EvidenceChunk] = []
        for idx, doc in enumerate(result.get("documents", [[]])[0]):
            metadata = result.get("metadatas", [[]])[0][idx]
            distance = result.get("distances", [[]])[0][idx]
            out.append(EvidenceChunk(
                id=result.get("ids", [[]])[0][idx],
                title=metadata.get("title", "Protocol"),
                source=metadata.get("source", "unknown"),
                text=doc,
                score=round(1/(1+distance), 4),
            ))
        return out
