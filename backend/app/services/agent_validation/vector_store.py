from collections import defaultdict
from threading import RLock

from app.services.agent_validation.models import IndexedChunk, StoredDocument


class InMemoryVectorStore:
    """Simple project-scoped in-memory document and vector store."""

    def __init__(self) -> None:
        self._documents: dict[str, dict[str, StoredDocument]] = defaultdict(dict)
        self._chunks: dict[str, list[IndexedChunk]] = defaultdict(list)
        self._lock = RLock()

    def upsert_documents(self, project_id: str, documents: list[StoredDocument]) -> None:
        with self._lock:
            for document in documents:
                self._documents[project_id][document.document_id] = document

    def get_documents(self, project_id: str, document_ids: list[str] | None = None) -> list[StoredDocument]:
        with self._lock:
            documents = self._documents.get(project_id, {})
            if document_ids is None:
                return list(documents.values())
            return [documents[document_id] for document_id in document_ids if document_id in documents]

    def replace_chunks(self, project_id: str, document_ids: list[str], chunks: list[IndexedChunk]) -> None:
        target_document_ids = set(document_ids)
        with self._lock:
            existing_chunks = self._chunks.get(project_id, [])
            self._chunks[project_id] = [
                chunk for chunk in existing_chunks if chunk.document_id not in target_document_ids
            ] + chunks

    def get_chunks(self, project_id: str) -> list[IndexedChunk]:
        with self._lock:
            return list(self._chunks.get(project_id, []))


vector_store = InMemoryVectorStore()
