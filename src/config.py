"""Application configuration using pydantic-settings."""

import json
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # LLM (OpenRouter)
    openrouter_api_key: str

    # Tools
    tavily_api_key: str
    e2b_api_key: str

    # Observability
    langfuse_public_key: str
    langfuse_secret_key: str
    langfuse_host: str = "https://cloud.langfuse.com"

    # Auth
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    # Agent Config
    default_hitl_mode: str = "sensitive"
    max_concurrent_subagents: int = 3
    max_delegation_rounds: int = 3

    # Rate Limits
    free_tier_rpm: int = 10
    free_tier_rpd: int = 100
    pro_tier_rpm: int = 60
    pro_tier_rpd: int = 1000

    # CORS - stored as string to avoid pydantic-settings parsing issues
    allowed_origins: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed_origins from string into list."""
        v = self.allowed_origins
        # Try JSON first
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
        # Treat as comma-separated or single value
        if "," in v:
            return [origin.strip() for origin in v.split(",")]
        return [v]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
