"""
Application Settings and Configuration Management

Environment-based configuration using Pydantic Settings.
All settings can be overridden via environment variables or .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    All settings can be overridden via environment variables.
    Use .env file for local development, env vars for production.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # API Configuration
    api_title: str = "LLM Guardrails Service"
    api_version: str = "1.0.0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # LLM Provider Configuration
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    default_llm_provider: str = "openai"
    default_model: str = "gpt-4-turbo-preview"
    
    # Redis Configuration (for rate limiting and caching)
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    redis_db: int = 0
    
    # Guardrail Configuration
    enable_pii_detection: bool = True
    enable_toxicity_filtering: bool = True
    enable_prompt_injection_detection: bool = True
    enable_rate_limiting: bool = True
    
    # PII Detection Settings
    pii_redaction_strategy: str = "replace"  # replace, hash, or remove
    pii_entities_to_detect: list[str] = [
        "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", 
        "CREDIT_CARD", "US_SSN", "MEDICAL_LICENSE"
    ]
    
    # Toxicity Filtering Settings
    toxicity_threshold: float = 0.7  # 0-1 scale, higher = more strict
    toxicity_check_output: bool = True
    
    # Rate Limiting Settings
    rate_limit_requests_per_minute: int = 60
    rate_limit_requests_per_hour: int = 1000
    rate_limit_enabled: bool = True
    
    # Monitoring Configuration
    enable_prometheus_metrics: bool = True
    prometheus_port: int = 9090
    
    # Logging Configuration
    log_level: str = "INFO"
    enable_audit_logging: bool = True
    
    # Performance Settings
    request_timeout_seconds: int = 30
    max_concurrent_requests: int = 100


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance to avoid repeated environment parsing.
    
    Returns:
        Settings: Application configuration instance
    """
    return Settings()
