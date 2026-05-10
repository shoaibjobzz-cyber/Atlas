from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.agent_validation import (
    AgentDocumentIndexResponse,
    AgentDocumentUploadRequest,
    AgentDocumentUploadResponse,
    AgentDocumentUploadSummary,
)
from app.services.agent_validation.chunking import chunk_text
from app.services.agent_validation.embeddings import EmbeddingError, EmbeddingService
from app.services.agent_validation.extractors import extract_text
from app.services.agent_validation.models import IndexedChunk, StoredDocument
from app.services.agent_validation.vector_store import InMemoryVectorStore


class IngestAgent:
    def __init__(self, store: InMemoryVectorStore, embedding_service: EmbeddingService | None) -> None:
        self._store = store
        self._embedding_service = embedding_service

    def upload_documents(self, payload: AgentDocumentUploadRequest) -> AgentDocumentUploadResponse:
        stored_documents: list[StoredDocument] = []
        summaries: list[AgentDocumentUploadSummary] = []
        for document in payload.documents:
            document_id = document.document_id or f"doc-{uuid4().hex[:12]}"
            extracted_text = extract_text(
                file_name=document.file_name,
                content=document.content,
                content_type=document.content_type,
            )
            stored_document = StoredDocument(
                document_id=document_id,
                file_name=document.file_name,
                content_type=document.content_type,
                content=extracted_text,
            )
            stored_documents.append(stored_document)
            summaries.append(
                AgentDocumentUploadSummary(
                    document_id=document_id,
                    file_name=document.file_name,
                    content_type=document.content_type,
                    character_count=len(extracted_text),
                )
            )
        self._store.upsert_documents(payload.project_id, stored_documents)
        return AgentDocumentUploadResponse(project_id=payload.project_id, uploaded_documents=summaries)

    def index_documents(
        self,
        *,
        project_id: str,
        document_ids: list[str] | None,
        chunk_size: int,
        chunk_overlap: int,
    ) -> AgentDocumentIndexResponse:
        documents = self._store.get_documents(project_id, document_ids=document_ids)
        indexed_chunks: list[IndexedChunk] = []
        indexed_document_ids: list[str] = []

        for document in documents:
            chunk_texts = chunk_text(document.content, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            if self._embedding_service is None:
                raise EmbeddingError("Embedding service is required before documents can be indexed.")
            embeddings = self._embedding_service.embed_texts(chunk_texts)
            indexed_document_ids.append(document.document_id)
            for index, (chunk_body, embedding) in enumerate(zip(chunk_texts, embeddings, strict=False), start=1):
                indexed_chunks.append(
                    IndexedChunk(
                        project_id=project_id,
                        document_id=document.document_id,
                        chunk_id=f"{document.document_id}-chunk-{index}",
                        file_name=document.file_name,
                        text=chunk_body,
                        embedding=embedding,
                    )
                )
            document.indexed_at = datetime.now(UTC)

        self._store.replace_chunks(project_id, indexed_document_ids, indexed_chunks)
        return AgentDocumentIndexResponse(
            project_id=project_id,
            indexed_document_ids=indexed_document_ids,
            indexed_chunk_count=len(indexed_chunks),
        )
