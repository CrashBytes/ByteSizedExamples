"""
Agent Configuration and Settings

Centralized configuration using Pydantic Settings with environment variable support.
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache
import logging


class AgentSettings(BaseSettings):
    """
    Agent configuration with environment variable support.
    
    All settings can be overridden with environment variables.
    Example: OPENAI_API_KEY=sk-... python app.py
    """
    
    # =============================================================================
    # LLM Configuration
    # =============================================================================
    openai_api_key: str
    anthropic_api_key: Optional[str] = None
    default_model: str = "gpt-4-turbo-preview"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2000
    
    # =============================================================================
    # Redis Configuration (Short-term Memory)
    # =============================================================================
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    redis_db: int = 0
    redis_url: Optional[str] = None
    
    # =============================================================================
    # PostgreSQL Configuration (Long-term Memory)
    # =============================================================================
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "agent_db"
    postgres_user: str = "agent_user"
    postgres_password: str
    postgres_pool_size: int = 10
    postgres_max_overflow: int = 20
    database_url: Optional[str] = None
    
    # =============================================================================
    # Agent Behavior
    # =============================================================================
    agent_max_iterations: int = 10
    agent_timeout_seconds: int = 60
    enable_tool_validation: bool = True
    max_history_messages: int = 20
    memory_ttl_seconds: int = 3600  # 1 hour
    
    # =============================================================================
    # Tool Configuration
    # =============================================================================
    web_search_max_results: int = 5
    web_search_timeout: int = 10
    weather_api_key: Optional[str] = None
    
    # =============================================================================
    # API Server Configuration
    # =============================================================================
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    enable_cors: bool = True
    cors_origins: str = "http://localhost:3000,http://localhost:8080"
    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 60
    
    # =============================================================================
    # Monitoring & Observability
    # =============================================================================
    enable_tracing: bool = True
    prometheus_port: int = 9090
    log_level: str = "INFO"
    log_format: str = "json"  # json or text
    otel_exporter_otlp_endpoint: Optional[str] = None
    service_name: str = "ai-agent"
    
    # =============================================================================
    # Security
    # =============================================================================
    api_key: Optional[str] = None
    jwt_secret: Optional[str] = None
    
    # =============================================================================
    # Feature Flags
    # =============================================================================
    enable_streaming: bool = False
    enable_multi_agent: bool = False
    enable_human_in_loop: bool = False
    
    # =============================================================================
    # Development/Production
    # =============================================================================
    debug: bool = False
    auto_reload: bool = True
    environment: str = "development"
    sentry_dsn: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"
    
    def get_redis_url(self) -> str:
        """Get Redis connection URL"""
        if self.redis_url:
            return self.redis_url
        
        password_part = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{password_part}{self.redis_host}:{self.redis_port}/{self.redis_db}"
    
    def get_postgres_url(self) -> str:
        """Get PostgreSQL connection URL"""
        if self.database_url:
            return self.database_url
        
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )
    
    def get_cors_origins_list(self) -> List[str]:
        """Get CORS origins as list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def setup_logging(self):
        """Configure logging based on settings"""
        log_level = getattr(logging, self.log_level.upper())
        
        if self.log_format == "json":
            from pythonjsonlogger import jsonlogger
            handler = logging.StreamHandler()
            formatter = jsonlogger.JsonFormatter(
                fmt="%(asctime)s %(name)s %(levelname)s %(message)s"
            )
            handler.setFormatter(formatter)
            logging.basicConfig(
                level=log_level,
                handlers=[handler]
            )
        else:
            logging.basicConfig(
                level=log_level,
                format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )


@lru_cache()
def get_settings() -> AgentSettings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are loaded once.
    """
    settings = AgentSettings()
    settings.setup_logging()
    return settings


# Convenience function for getting settings in code
def get_config() -> AgentSettings:
    """Alias for get_settings()"""
    return get_settings()


# Example usage
if __name__ == "__main__":
    settings = get_settings()
    print(f"Environment: {settings.environment}")
    print(f"Default Model: {settings.default_model}")
    print(f"Redis URL: {settings.get_redis_url()}")
    print(f"Postgres URL: {settings.get_postgres_url()}")
    print(f"Log Level: {settings.log_level}")
