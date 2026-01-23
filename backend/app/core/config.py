from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """애플리케이션 설정"""

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
    secret_key: str = "change-this-secret-key-in-production"

    # -------------------------------------------------------------------------
    # Frontend Origin (CORS)
    # -------------------------------------------------------------------------
    frontend_origin: str = "http://localhost:5173"

    # -------------------------------------------------------------------------
    # Database - PostgreSQL
    # -------------------------------------------------------------------------
    database_url: Optional[str] = None
    database_url_async: Optional[str] = None
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "edonge0213"
    db_password: str = "@@71knight"

    @property
    def db_url(self) -> str:
        """DATABASE_URL이 있으면 사용, 없으면 개별 설정으로 생성"""
        if self.database_url:
            return self.database_url
        return (
            "postgresql+psycopg2://"
            f"{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def db_url_async(self) -> str:
        """비동기 드라이버용 URL"""
        if self.database_url_async:
            return self.database_url_async
        if self.database_url:
            if "postgresql+asyncpg://" in self.database_url:
                return self.database_url
            if "postgresql+psycopg2://" in self.database_url:
                return self.database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        return (
            "postgresql+asyncpg://"
            f"{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    # -------------------------------------------------------------------------
    # JWT Authentication
    # -------------------------------------------------------------------------
    jwt_secret_key: str = "change-this-jwt-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # -------------------------------------------------------------------------
    # OpenAI API (LLM/RAG)
    # -------------------------------------------------------------------------
    # NOTE: 요청에 따라 키를 파일에 직접 보관합니다.
    luxia_api_key: str = None
    luxia_base_url: str = "https://bridge.luxiacloud.com/llm/openai"
    luxia_model: str = "gpt-4o-mini-2024-07-18"

    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"

    # -------------------------------------------------------------------------
    # Vector DB
    # -------------------------------------------------------------------------
    vector_base_dir: Path = BASE_DIR / "backend" / "app" / "llm" / "vector_db"
    mode_vector_dirs: dict = {
        "mom": ["mom_docs", "common_docs"],
        "doctor": ["doctor_docs", "common_docs"],
        "nutrition": ["nutrient_docs", "common_docs"],
    }

    # -------------------------------------------------------------------------
    # Optional: Redis
    # -------------------------------------------------------------------------
    redis_url: Optional[str] = None

    # -------------------------------------------------------------------------
    # Optional: AWS S3
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
