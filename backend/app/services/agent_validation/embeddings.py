from typing import Protocol

import httpx
from openai import OpenAI

from app.core.config import settings


class EmbeddingError(Exception):
    pass


class EmbeddingService(Protocol):
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...


class OpenAIEmbeddingService:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise EmbeddingError("OPENAI_API_KEY is required for agent-validation embeddings.")
        self._client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.resolved_openai_base_url,
            timeout=settings.agent_openai_timeout_seconds,
            max_retries=settings.agent_openai_max_retries,
            http_client=httpx.Client(trust_env=False),
        )

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            response = self._client.embeddings.create(model=settings.agent_embedding_model, input=texts)
        except Exception as error:  # pragma: no cover - external provider failure
            raise EmbeddingError(f"Embedding request failed: {error}") from error
        return [list(item.embedding) for item in response.data]
