import os


class Settings:
    app_host: str = os.environ.get("APP_HOST", "0.0.0.0")
    app_port: int = int(os.environ.get("APP_PORT", "8000"))
    agent_triage_model: str = os.environ.get("AGENT_TRIAGE_MODEL", "gpt-5.4-nano")
    agent_deep_review_model: str = os.environ.get("AGENT_DEEP_REVIEW_MODEL", "gpt-5.4-mini")
    agent_embedding_model: str = os.environ.get("AGENT_EMBEDDING_MODEL", "text-embedding-3-small")
    agent_chunk_size: int = int(os.environ.get("AGENT_CHUNK_SIZE", "900"))
    agent_chunk_overlap: int = int(os.environ.get("AGENT_CHUNK_OVERLAP", "150"))
    agent_top_k_chunks: int = int(os.environ.get("AGENT_TOP_K_CHUNKS", "5"))
    agent_max_retrieved_chars: int = int(os.environ.get("AGENT_MAX_RETRIEVED_CHARS", "3500"))
    agent_max_duplicate_candidates: int = int(os.environ.get("AGENT_MAX_DUPLICATE_CANDIDATES", "3"))
    agent_triage_confidence_threshold: float = float(
        os.environ.get("AGENT_TRIAGE_CONFIDENCE_THRESHOLD", "0.78")
    )
    agent_openai_timeout_seconds: float = float(os.environ.get("AGENT_OPENAI_TIMEOUT_SECONDS", "30"))
    agent_openai_max_retries: int = int(os.environ.get("AGENT_OPENAI_MAX_RETRIES", "1"))
    requirement_generation_provider: str = os.environ.get("REQUIREMENT_GENERATION_PROVIDER", "mock")
    requirement_generation_fallback_to_mock: bool = (
        os.environ.get("REQUIREMENT_GENERATION_FALLBACK_TO_MOCK", "true").strip().lower() == "true"
    )
    openai_api_key: str | None = os.environ.get("OPENAI_API_KEY")
    openai_base_url: str | None = os.environ.get("OPENAI_BASE_URL")
    openai_model: str = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
    openai_timeout_seconds: float = float(os.environ.get("OPENAI_TIMEOUT_SECONDS", "30"))
    openai_max_retries: int = int(os.environ.get("OPENAI_MAX_RETRIES", "1"))
    auth_cookie_name: str = os.environ.get("AUTH_COOKIE_NAME", "rip_session")
    auth_session_hours: int = int(os.environ.get("AUTH_SESSION_HOURS", "72"))
    auth_cookie_secure: bool = os.environ.get("AUTH_COOKIE_SECURE", "false").strip().lower() == "true"
    auth_cookie_samesite: str = os.environ.get("AUTH_COOKIE_SAMESITE", "lax").strip().lower()
    auth_default_username: str = os.environ.get("AUTH_DEFAULT_USERNAME", "demo")
    auth_default_password: str = os.environ.get("AUTH_DEFAULT_PASSWORD", "demo1234")
    auth_default_display_name: str = os.environ.get("AUTH_DEFAULT_DISPLAY_NAME", "Demo Engineer")
    frontend_origins_raw: str = os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    frontend_origin_regex: str | None = os.environ.get("FRONTEND_ORIGIN_REGEX")
    database_url: str = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg://requirements_app:requirements_app@localhost:5432/requirements_intelligence",
    )

    @property
    def resolved_openai_base_url(self) -> str:
        configured = (self.openai_base_url or "").strip()
        return configured or "https://api.openai.com/v1"

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins_raw.split(",") if origin.strip()]


settings = Settings()
