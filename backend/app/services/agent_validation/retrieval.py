import math
import re

from app.schemas.agent_validation import RetrievedChunkReference
from app.services.agent_validation.embeddings import EmbeddingService
from app.services.agent_validation.models import DuplicateCandidate, RetrievedChunk
from app.services.agent_validation.vector_store import InMemoryVectorStore


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    numerator = sum(a * b for a, b in zip(left, right, strict=False))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return numerator / (left_norm * right_norm)


def _tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 2}


def _lexical_overlap(query: str, candidate: str) -> float:
    query_tokens = _tokenize(query)
    candidate_tokens = _tokenize(candidate)
    if not query_tokens or not candidate_tokens:
        return 0.0
    return len(query_tokens & candidate_tokens) / len(query_tokens | candidate_tokens)


class RetrievalAgent:
    def __init__(self, store: InMemoryVectorStore, embedding_service: EmbeddingService) -> None:
        self._store = store
        self._embedding_service = embedding_service

    def retrieve(self, *, project_id: str, requirement_text: str, top_k: int) -> list[RetrievedChunk]:
        stored_chunks = self._store.get_chunks(project_id)
        if not stored_chunks:
            return []
        query_embedding = self._embedding_service.embed_texts([requirement_text])[0]
        candidates: list[RetrievedChunk] = []
        for chunk in stored_chunks:
            semantic_score = _cosine_similarity(query_embedding, chunk.embedding)
            lexical_bonus = 0.15 * _lexical_overlap(requirement_text, chunk.text)
            candidates.append(
                RetrievedChunk(
                    project_id=chunk.project_id,
                    document_id=chunk.document_id,
                    chunk_id=chunk.chunk_id,
                    file_name=chunk.file_name,
                    text=chunk.text,
                    score=semantic_score + lexical_bonus,
                )
            )
        ranked = sorted(candidates, key=lambda item: item.score, reverse=True)
        return ranked[:top_k]


def build_duplicate_candidates(
    *,
    requirement_text: str,
    existing_requirements: list[tuple[str, str, str]],
    max_candidates: int,
) -> list[DuplicateCandidate]:
    scored: list[DuplicateCandidate] = []
    for requirement_id, title, text in existing_requirements:
        score = _lexical_overlap(requirement_text, text)
        if score <= 0:
            continue
        scored.append(
            DuplicateCandidate(
                requirement_id=requirement_id,
                title=title,
                text=text,
                score=score,
            )
        )
    return sorted(scored, key=lambda item: item.score, reverse=True)[:max_candidates]


def to_retrieved_chunk_references(chunks: list[RetrievedChunk], *, max_chars: int) -> list[RetrievedChunkReference]:
    remaining_chars = max_chars
    references: list[RetrievedChunkReference] = []
    for chunk in chunks:
        if remaining_chars <= 0:
            break
        preview = chunk.text[: min(len(chunk.text), remaining_chars)]
        remaining_chars -= len(preview)
        references.append(
            RetrievedChunkReference(
                document_id=chunk.document_id,
                chunk_id=chunk.chunk_id,
                file_name=chunk.file_name,
                score=round(chunk.score, 4),
                text_preview=preview,
            )
        )
    return references
