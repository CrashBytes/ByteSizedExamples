"""
Integration tests for complete guardrail flow

Tests the full request flow through all guardrails.
"""

import pytest
from httpx import AsyncClient
from src.api.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "guardrails_enabled" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint returns API information"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "docs" in data


@pytest.mark.asyncio
async def test_clean_prompt_completion():
    """Test that clean prompts pass through guardrails"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/completions",
            json={
                "prompt": "Write a professional email about quarterly results",
                "user_id": "test_user_123",
                "provider": "openai",
                "max_tokens": 100
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "input_guardrails" in data
        assert "blocked" in data
        assert data["input_guardrails"]["passed"] == True


@pytest.mark.asyncio
async def test_pii_in_prompt_blocked():
    """Test that PII in prompts triggers guardrails"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/completions",
            json={
                "prompt": "My email is john.doe@example.com",
                "user_id": "test_user_456"
            }
        )
        
        data = response.json()
        
        # Should detect PII
        violations = data["input_guardrails"]["violations"]
        assert any(
            v["guardrail_type"] == "pii_detection"
            for v in violations
        )


@pytest.mark.asyncio
async def test_toxic_content_blocked():
    """Test that toxic content triggers guardrails"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/completions",
            json={
                "prompt": "I hate everyone and want to kill them all",
                "user_id": "test_user_789"
            }
        )
        
        data = response.json()
        
        # Should detect toxicity
        violations = data["input_guardrails"]["violations"]
        assert any(
            v["guardrail_type"] == "toxicity_filtering"
            for v in violations
        )


@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Test Prometheus metrics endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/metrics")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
        assert b"guardrails_requests_total" in response.content
