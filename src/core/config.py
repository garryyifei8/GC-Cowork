"""
Configuration management for the AI-native project collaboration platform.
Uses pydantic-settings for environment-based configuration.
"""
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    app_name: str = "AI原生项目协作平台"
    app_version: str = "0.1.0"
    debug: bool = False

    # LLM (domestic Chinese models only — data must not leave China)
    llm_provider: str = "deepseek"  # deepseek | qwen | glm | wenxin
    llm_model: str = "deepseek-chat"
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_api_base: str = Field(default="https://api.deepseek.com", alias="LLM_API_BASE")
    llm_simple_model: str = "qwen-7b"  # lightweight model for simple tasks
    llm_complex_model: str = "deepseek-chat"  # large model for complex analysis

    # Vector DB
    vector_db_host: str = Field(default="localhost", alias="VECTOR_DB_HOST")
    vector_db_port: int = Field(default=19530, alias="VECTOR_DB_PORT")
    embedding_model: str = "BAAI/bge-m3"

    # Performance targets (from specs)
    max_simple_response_seconds: float = 3.0
    max_complex_response_seconds: float = 15.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


settings = Settings()
