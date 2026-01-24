from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """
    애플리케이션 설정

    모든 값은 .env 파일에서 관리됩니다.
    기본값은 개발 편의를 위한 것이며, 민감 정보는 반드시 .env에서 설정하세요.
    """

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -------------------------------------------------------------------------
    # Application
    # -------------------------------------------------------------------------
    app_env: str = "development"
    debug: bool = True
    secret_key: str  # .env 필수

    # -------------------------------------------------------------------------
    # Frontend Origin (CORS)
    # -------------------------------------------------------------------------
    frontend_origin: str = "http://localhost:5173"

    # -------------------------------------------------------------------------
    # Database - PostgreSQL
    # -------------------------------------------------------------------------
    database_url: str  # .env 필수

    @property
    def db_url(self) -> str:
        """DATABASE_URL 반환"""
        return self.database_url

    @property
    def db_url_async(self) -> str:
        """비동기 드라이버용 URL"""
        if "postgresql+asyncpg://" in self.database_url:
            return self.database_url
        if "postgresql+psycopg2://" in self.database_url:
            return self.database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")

    # -------------------------------------------------------------------------
    # JWT Authentication
    # -------------------------------------------------------------------------
    jwt_secret_key: str  # .env 필수
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # -------------------------------------------------------------------------
    # OpenAI API (LLM/RAG)
    # -------------------------------------------------------------------------
    openai_api_key: Optional[str] = None

    # -------------------------------------------------------------------------
    # Optional: Redis
    # -------------------------------------------------------------------------
    redis_url: Optional[str] = None

    # -------------------------------------------------------------------------
    # Optional: AWS S3 (현재 미사용)
    # -------------------------------------------------------------------------
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket: Optional[str] = None
    aws_region: str = "ap-northeast-2"


@lru_cache
def get_settings() -> Settings:
    """설정 싱글톤 (캐시됨)"""
    return Settings()


# 전역 설정 인스턴스
settings = get_settings()
