from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass(slots=True)
class StoredDocument:
    document_id: str
    file_name: str
    content_type: str
    content: str
    uploaded_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    indexed_at: datetime | None = None


@dataclass(slots=True)
class IndexedChunk:
    project_id: str
    document_id: str
    chunk_id: str
    file_name: str
    text: str
    embedding: list[float]


@dataclass(slots=True)
class RetrievedChunk:
    project_id: str
    document_id: str
    chunk_id: str
    file_name: str
    text: str
    score: float


@dataclass(slots=True)
class DuplicateCandidate:
    requirement_id: str
    title: str
    text: str
    score: float


@dataclass(slots=True)
class RouteDecision:
    route_taken: str
    needs_escalation: bool
    reason: str
