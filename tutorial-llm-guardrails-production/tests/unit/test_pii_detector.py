"""
Unit tests for PII Detector

Tests PII detection and redaction functionality.
"""

import pytest
from src.guardrails.pii_detector import PIIDetector


@pytest.fixture
def pii_detector():
    """Fixture providing PIIDetector instance"""
    return PIIDetector()


@pytest.mark.asyncio
async def test_email_detection(pii_detector):
    """Test detection of email addresses"""
    text = "Contact me at john.doe@example.com for details"
    
    entities = await pii_detector.detect_pii(text)
    
    assert len(entities) > 0
    assert any(e["entity_type"] == "EMAIL_ADDRESS" for e in entities)


@pytest.mark.asyncio
async def test_email_redaction(pii_detector):
    """Test email redaction replaces sensitive data"""
    text = "My email is test@example.com"
    
    redacted, entities = await pii_detector.redact_pii(text)
    
    assert "test@example.com" not in redacted
    assert "<EMAIL_ADDRESS>" in redacted
    assert len(entities) > 0


@pytest.mark.asyncio
async def test_no_pii_detection(pii_detector):
    """Test that clean text returns no PII"""
    text = "This is a clean message with no personal information"
    
    entities = await pii_detector.detect_pii(text)
    redacted, _ = await pii_detector.redact_pii(text)
    
    # Should have no entities detected
    assert len(entities) == 0
    # Text should remain unchanged
    assert redacted == text


@pytest.mark.asyncio
async def test_multiple_emails(pii_detector):
    """Test detection of multiple email addresses"""
    text = "Contact john@example.com or jane@example.org"
    
    entities = await pii_detector.detect_pii(text)
    redacted, _ = await pii_detector.redact_pii(text)
    
    # Should detect emails
    assert len(entities) > 0
    # Both emails should be redacted
    assert "john@example.com" not in redacted
    assert "jane@example.org" not in redacted
