"""Configuration management for the application"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "Agentic Meeting Transcription System"
    debug: bool = False
    log_level: str = "INFO"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4-turbo-preview"
    openai_temperature: float = 0.3
    
    # Hugging Face (for Pyannote)
    huggingface_token: str
    
    # Whisper
    whisper_model_size: str = "base"  # tiny, base, small, medium, large
    whisper_device: Optional[str] = None  # cuda, cpu, or None for auto-detect
    
    # Database
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection_name: str = "meeting_transcripts"
    
    # Audio Processing
    max_audio_duration: int = 7200  # 2 hours in seconds
    audio_sample_rate: int = 16000
    audio_chunk_duration: float = 2.0  # seconds
    
    # Vector Search
    embedding_model: str = "all-MiniLM-L6-v2"
    rag_top_k: int = 5
    rag_score_threshold: float = 0.7
    
    # Agent Settings
    max_concurrent_agents: int = 10
    agent_timeout: int = 300  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
