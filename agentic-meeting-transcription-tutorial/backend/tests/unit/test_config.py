"""
Unit tests for configuration management in config.py

Tests cover configuration loading, validation, and property methods
to achieve 100% coverage of config.py
"""
import pytest
from unittest.mock import patch, Mock
from pydantic import ValidationError


class TestSettings:
    """Tests for Settings class"""
    
    def test_default_settings(self):
        """Test default configuration values"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'test-key',
            'HUGGINGFACE_TOKEN': 'test-token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.app_name == "Agentic Meeting Transcription System"
            assert settings.debug == False
            assert settings.log_level == "INFO"
            assert settings.api_host == "0.0.0.0"
            assert settings.api_port == 8000
    
    def test_openai_settings(self):
        """Test OpenAI configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'sk-test123',
            'HUGGINGFACE_TOKEN': 'hf-token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.openai_api_key == 'sk-test123'
            assert settings.openai_model == "gpt-4-turbo-preview"
            assert settings.openai_temperature == 0.3
    
    def test_huggingface_settings(self):
        """Test Hugging Face configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'hf_test_token_123',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.huggingface_token == 'hf_test_token_123'
    
    def test_whisper_settings(self):
        """Test Whisper configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db',
            'WHISPER_MODEL_SIZE': 'large',
            'WHISPER_DEVICE': 'cuda'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.whisper_model_size == "large"
            assert settings.whisper_device == "cuda"
    
    def test_database_settings(self):
        """Test database configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'testuser',
            'POSTGRES_PASSWORD': 'testpass',
            'POSTGRES_DB': 'testdb',
            'POSTGRES_HOST': 'db.example.com',
            'POSTGRES_PORT': '5433'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.postgres_user == "testuser"
            assert settings.postgres_password == "testpass"
            assert settings.postgres_db == "testdb"
            assert settings.postgres_host == "db.example.com"
            assert settings.postgres_port == 5433
    
    def test_database_url_property(self):
        """Test database_url property generation"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'myuser',
            'POSTGRES_PASSWORD': 'mypass',
            'POSTGRES_DB': 'mydb',
            'POSTGRES_HOST': 'localhost',
            'POSTGRES_PORT': '5432'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            expected_url = "postgresql+asyncpg://myuser:mypass@localhost:5432/mydb"
            assert settings.database_url == expected_url
    
    def test_qdrant_settings(self):
        """Test Qdrant vector database configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db',
            'QDRANT_URL': 'http://qdrant:6333',
            'QDRANT_API_KEY': 'qdrant-key-123',
            'QDRANT_COLLECTION_NAME': 'custom_collection'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.qdrant_url == "http://qdrant:6333"
            assert settings.qdrant_api_key == "qdrant-key-123"
            assert settings.qdrant_collection_name == "custom_collection"
    
    def test_audio_processing_settings(self):
        """Test audio processing configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db',
            'MAX_AUDIO_DURATION': '3600',
            'AUDIO_SAMPLE_RATE': '48000',
            'AUDIO_CHUNK_DURATION': '1.5'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.max_audio_duration == 3600
            assert settings.audio_sample_rate == 48000
            assert settings.audio_chunk_duration == 1.5
    
    def test_vector_search_settings(self):
        """Test vector search configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db',
            'EMBEDDING_MODEL': 'sentence-transformers/all-mpnet-base-v2',
            'RAG_TOP_K': '10',
            'RAG_SCORE_THRESHOLD': '0.8'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.embedding_model == "sentence-transformers/all-mpnet-base-v2"
            assert settings.rag_top_k == 10
            assert settings.rag_score_threshold == 0.8
    
    def test_agent_settings(self):
        """Test agent configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db',
            'MAX_CONCURRENT_AGENTS': '20',
            'AGENT_TIMEOUT': '600'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert settings.max_concurrent_agents == 20
            assert settings.agent_timeout == 600
    
    def test_cors_origins_default(self):
        """Test CORS origins default configuration"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import Settings
            
            settings = Settings()
            
            assert "http://localhost:3000" in settings.cors_origins
            assert "http://localhost:8000" in settings.cors_origins


class TestGetSettings:
    """Tests for get_settings function"""
    
    def test_get_settings_returns_cached_instance(self):
        """Test get_settings returns same instance (caching)"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import get_settings
            
            settings1 = get_settings()
            settings2 = get_settings()
            
            assert settings1 is settings2
    
    def test_get_settings_returns_settings_instance(self):
        """Test get_settings returns Settings instance"""
        with patch.dict('os.environ', {
            'OPENAI_API_KEY': 'key',
            'HUGGINGFACE_TOKEN': 'token',
            'POSTGRES_USER': 'user',
            'POSTGRES_PASSWORD': 'pass',
            'POSTGRES_DB': 'db'
        }):
            from app.config import get_settings, Settings
            
            settings = get_settings()
            
            assert isinstance(settings, Settings)
