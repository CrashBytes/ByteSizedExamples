"""
Basic tests for the AI reasoning system.

Run with: pytest tests/test_basic.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_reason_endpoint():
    """Test the basic reasoning endpoint."""
    response = client.post(
        "/api/v1/reason",
        json={
            "prompt": "What is 2 + 2?",
            "strategy": "direct"
        }
    )
    assert response.status_code == 200
    result = response.json()
    assert "strategy_used" in result
    assert "final_answer" in result
    assert "cost_usd" in result

def test_metrics_endpoint():
    """Test the metrics endpoint."""
    response = client.get("/api/v1/metrics?hours=24")
    assert response.status_code == 200
    metrics = response.json()
    assert "total_requests" in metrics
    assert "total_cost_usd" in metrics

def test_recommendations_endpoint():
    """Test the recommendations endpoint."""
    response = client.get("/api/v1/recommendations")
    assert response.status_code == 200
    result = response.json()
    assert "recommendations" in result
    assert isinstance(result["recommendations"], list)

# TODO: Add more comprehensive tests after implementing full reasoning engine
# See tutorial article for complete test examples:
# https://crashbytes.com/tutorial-production-ai-reasoning-systems-chain-of-thought-2025
