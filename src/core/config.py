"""
Configuration management for the AI-native project collaboration platform.
Uses pydantic-settings for environment-based configuration.
"""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "AI原生项目协作平台"
    app_version: str = "0.1.0"
    debug: bool = False

    # LLM — supports DeepSeek cloud or LM Studio local
    llm_provider: str = "deepseek"  # deepseek | lmstudio | qwen | glm
    llm_model: str = Field(default="deepseek-chat", alias="LLM_MODEL")
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_api_base: str = Field(default="https://api.deepseek.com", alias="LLM_API_BASE")
    llm_simple_model: str = "qwen-7b"
    llm_complex_model: str = "deepseek-chat"

    # Vector DB
    vector_db_host: str = Field(default="localhost", alias="VECTOR_DB_HOST")
    vector_db_port: int = Field(default=19530, alias="VECTOR_DB_PORT")
    embedding_model: str = Field(default="BAAI/bge-small-zh-v1.5", alias="EMBEDDING_MODEL")
    embedding_dimension: int = Field(default=512, alias="EMBEDDING_DIMENSION")
    vector_db_backend: str = Field(default="memory", alias="VECTOR_DB_BACKEND")

    # Performance targets (from specs)
    max_simple_response_seconds: float = 3.0
    max_complex_response_seconds: float = 15.0

    # Supabase (optional — only used when USE_SUPABASE=true)
    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_studio_url: str = ""
    use_supabase: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True
        extra = "ignore"  # Ignore unknown env vars


settings = Settings()
