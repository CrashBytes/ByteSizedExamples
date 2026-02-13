"""
Unit tests for FastAPI endpoints.

Tests cover:
- Root endpoint
- Health check endpoint
- Metrics endpoint
- Completions endpoint with guardrails
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient


class TestRootEndpoint:
    """Test root endpoint"""
    
    def test_root_returns_api_info(self):
        """Test root endpoint returns API information"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "LLM Guardrails API"
        assert "version" in data
        assert "docs" in data
        assert "health" in data


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_returns_healthy(self):
        """Test health check returns healthy status"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "guardrails_enabled" in data
        assert "dependencies" in data
    
    def test_health_check_shows_guardrail_status(self):
        """Test health check shows guardrail configuration"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.get("/health")
        
        data = response.json()
        guardrails = data["guardrails_enabled"]
        
        assert "pii_detection" in guardrails
        assert "toxicity_filtering" in guardrails
        assert "rate_limiting" in guardrails


class TestMetricsEndpoint:
    """Test Prometheus metrics endpoint"""
    
    def test_metrics_returns_text(self):
        """Test metrics endpoint returns text content"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.get("/metrics")
        
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")


class TestCompletionsEndpoint:
    """Test LLM completions endpoint"""
    
    def test_completions_valid_request(self):
        """Test completions with valid request passes guardrails"""
        from src.api.main import app
        from src.models.schemas import GuardrailCheckResult
        
        # Mock the orchestrator with actual GuardrailCheckResult objects
        with patch('src.api.main.orchestrator') as mock_orch:
            mock_input_check = GuardrailCheckResult(
                passed=True,
                violations=[],
                processing_time_ms=10.0
            )
            
            mock_output_check = GuardrailCheckResult(
                passed=True,
                violations=[],
                processing_time_ms=5.0
            )
            
            mock_orch.check_input_guardrails = AsyncMock(return_value=mock_input_check)
            mock_orch.check_output_guardrails = AsyncMock(return_value=mock_output_check)
            
            client = TestClient(app)
            response = client.post(
                "/api/v1/completions",
                json={
                    "prompt": "Hello, how are you?",
                    "user_id": "test_user",
                    "provider": "openai"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["blocked"] is False
            assert data["completion"] is not None
            assert "request_id" in data
    
    def test_completions_blocked_by_input_guardrails(self):
        """Test completions blocked by input guardrails"""
        from src.api.main import app
        from src.models.schemas import GuardrailCheckResult, GuardrailViolation
        
        with patch('src.api.main.orchestrator') as mock_orch:
            mock_violation = GuardrailViolation(
                guardrail_type="toxicity",
                severity="high",
                message="Toxic content detected"
            )
            
            mock_input_check = GuardrailCheckResult(
                passed=False,
                violations=[mock_violation],
                processing_time_ms=15.0
            )
            
            mock_orch.check_input_guardrails = AsyncMock(return_value=mock_input_check)
            
            client = TestClient(app)
            response = client.post(
                "/api/v1/completions",
                json={
                    "prompt": "Bad content here",
                    "user_id": "test_user",
                    "provider": "openai"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["blocked"] is True
            assert data["completion"] is None
    
    def test_completions_blocked_by_output_guardrails(self):
        """Test completions blocked by output guardrails"""
        from src.api.main import app
        from src.models.schemas import GuardrailCheckResult, GuardrailViolation
        
        with patch('src.api.main.orchestrator') as mock_orch:
            mock_input_check = GuardrailCheckResult(
                passed=True,
                violations=[],
                processing_time_ms=10.0
            )
            
            mock_violation = GuardrailViolation(
                guardrail_type="pii",
                severity="medium",
                message="PII detected in output"
            )
            
            mock_output_check = GuardrailCheckResult(
                passed=False,
                violations=[mock_violation],
                processing_time_ms=12.0
            )
            
            mock_orch.check_input_guardrails = AsyncMock(return_value=mock_input_check)
            mock_orch.check_output_guardrails = AsyncMock(return_value=mock_output_check)
            
            client = TestClient(app)
            response = client.post(
                "/api/v1/completions",
                json={
                    "prompt": "Generate some text",
                    "user_id": "test_user",
                    "provider": "anthropic"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["blocked"] is True
    
    def test_completions_error_handling(self):
        """Test completions handles errors gracefully"""
        from src.api.main import app
        
        with patch('src.api.main.orchestrator') as mock_orch:
            mock_orch.check_input_guardrails = AsyncMock(
                side_effect=Exception("Orchestrator error")
            )
            
            client = TestClient(app)
            response = client.post(
                "/api/v1/completions",
                json={
                    "prompt": "Test prompt",
                    "user_id": "test_user",
                    "provider": "openai"
                }
            )
            
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
    
    def test_completions_invalid_provider(self):
        """Test completions rejects invalid provider"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.post(
            "/api/v1/completions",
            json={
                "prompt": "Test prompt",
                "user_id": "test_user",
                "provider": "invalid_provider"
            }
        )
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_completions_missing_prompt(self):
        """Test completions requires prompt"""
        from src.api.main import app
        
        client = TestClient(app)
        response = client.post(
            "/api/v1/completions",
            json={
                "user_id": "test_user",
                "provider": "openai"
            }
        )
        
        assert response.status_code == 422


class TestGenerateCompletionPlaceholder:
    """Test placeholder completion generator"""
    
    def test_generate_placeholder_returns_string(self):
        """Test placeholder returns appropriate string"""
        from src.api.main import _generate_completion_placeholder
        from src.models.schemas import LLMRequest, LLMProvider
        
        request = LLMRequest(
            prompt="Test prompt for completion",
            user_id="test_user",
            provider=LLMProvider.OPENAI
        )
        
        result = _generate_completion_placeholder(request)
        
        assert isinstance(result, str)
        assert "placeholder" in result.lower()
        assert "openai" in result.lower()
    
    def test_generate_placeholder_includes_prompt_preview(self):
        """Test placeholder includes prompt preview"""
        from src.api.main import _generate_completion_placeholder
        from src.models.schemas import LLMRequest, LLMProvider
        
        request = LLMRequest(
            prompt="A very specific test prompt that should appear",
            user_id="test_user",
            provider=LLMProvider.ANTHROPIC
        )
        
        result = _generate_completion_placeholder(request)
        
        assert "A very specific" in result


class TestLifespan:
    """Test application lifespan events"""
    
    def test_app_startup(self):
        """Test application starts correctly"""
        from src.api.main import app
        
        # Using TestClient handles startup/shutdown
        with TestClient(app) as client:
            response = client.get("/")
            assert response.status_code == 200
