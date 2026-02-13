"""
Comprehensive tests for Guardrail Orchestrator

Tests orchestration of all guardrails including:
- Input guardrail checks
- Output guardrail checks  
- PII detection integration
- Toxicity filtering integration
- Rate limiting integration
- Violation handling
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from src.guardrails.orchestrator import GuardrailOrchestrator
from src.models.schemas import LLMRequest, LLMProvider, GuardrailViolation


@pytest.fixture
def mock_settings():
    """Mock settings"""
    with patch('src.guardrails.orchestrator.get_settings') as mock:
        settings = MagicMock()
        settings.enable_pii_detection = True
        settings.enable_toxicity_filtering = True
        settings.enable_rate_limiting = True
        settings.toxicity_check_output = True
        settings.toxicity_threshold = 0.7
        mock.return_value = settings
        yield settings


@pytest.fixture
def sample_request():
    """Create a sample LLM request"""
    return LLMRequest(
        prompt="Hello, my name is John Doe",
        user_id="test_user_123",
        provider=LLMProvider.OPENAI,
        model="gpt-4"
    )


class TestOrchestratorInitialization:
    """Test orchestrator initialization"""
    
    def test_init(self, mock_settings):
        """Test orchestrator initialization"""
        orchestrator = GuardrailOrchestrator()
        
        assert orchestrator.settings is not None
        assert orchestrator.pii_detector is not None
        assert orchestrator.toxicity_detector is not None


class TestInputGuardrails:
    """Test input guardrail checks"""
    
    @pytest.mark.asyncio
    async def test_check_input_clean_prompt(self, mock_settings, sample_request):
        """Test input guardrails with clean prompt"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'):
            orchestrator = GuardrailOrchestrator()
            
            # Mock all checks to pass
            orchestrator._check_rate_limit = AsyncMock(return_value=None)
            orchestrator._check_pii = AsyncMock(return_value=(None, None))
            orchestrator._check_toxicity = AsyncMock(return_value=None)
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            assert result.passed is True
            assert len(result.violations) == 0
            assert result.modified_content is None
            assert result.processing_time_ms > 0
    
    @pytest.mark.asyncio
    async def test_check_input_with_rate_limit_violation(self, mock_settings, sample_request):
        """Test input guardrails with rate limit violation"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'), \
             patch('src.guardrails.orchestrator.record_guardrail_violation'):
            
            orchestrator = GuardrailOrchestrator()
            
            # Mock rate limit violation
            rate_violation = GuardrailViolation(
                guardrail_type="rate_limiting",
                severity="high",
                message="Rate limit exceeded",
                details={},
                timestamp=datetime.utcnow()
            )
            orchestrator._check_rate_limit = AsyncMock(return_value=rate_violation)
            orchestrator._check_pii = AsyncMock(return_value=(None, None))
            orchestrator._check_toxicity = AsyncMock(return_value=None)
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            assert result.passed is False
            assert len(result.violations) == 1
            assert result.violations[0].guardrail_type == "rate_limiting"
    
    @pytest.mark.asyncio
    async def test_check_input_with_pii_violation(self, mock_settings, sample_request):
        """Test input guardrails with PII violation"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'), \
             patch('src.guardrails.orchestrator.record_guardrail_violation'):
            
            orchestrator = GuardrailOrchestrator()
            
            # Mock PII violation
            pii_violation = GuardrailViolation(
                guardrail_type="pii_detection",
                severity="high",
                message="PII detected",
                details={'entities': ['PERSON']},
                timestamp=datetime.utcnow()
            )
            redacted_text = "Hello, my name is [PERSON]"
            
            orchestrator._check_rate_limit = AsyncMock(return_value=None)
            orchestrator._check_pii = AsyncMock(return_value=(pii_violation, redacted_text))
            orchestrator._check_toxicity = AsyncMock(return_value=None)
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            assert result.passed is False
            assert len(result.violations) == 1
            assert result.violations[0].guardrail_type == "pii_detection"
            assert result.modified_content == redacted_text
    
    @pytest.mark.asyncio
    async def test_check_input_with_toxicity_violation(self, mock_settings, sample_request):
        """Test input guardrails with toxicity violation"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'), \
             patch('src.guardrails.orchestrator.record_guardrail_violation'):
            
            orchestrator = GuardrailOrchestrator()
            
            # Mock toxicity violation
            tox_violation = GuardrailViolation(
                guardrail_type="toxicity_filtering",
                severity="high",
                message="Toxic content detected",
                details={'scores': {'toxicity': 0.9}},
                timestamp=datetime.utcnow()
            )
            
            orchestrator._check_rate_limit = AsyncMock(return_value=None)
            orchestrator._check_pii = AsyncMock(return_value=(None, None))
            orchestrator._check_toxicity = AsyncMock(return_value=tox_violation)
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            assert result.passed is False
            assert len(result.violations) == 1
            assert result.violations[0].guardrail_type == "toxicity_filtering"
    
    @pytest.mark.asyncio
    async def test_check_input_with_multiple_violations(self, mock_settings, sample_request):
        """Test input guardrails with multiple violations"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'), \
             patch('src.guardrails.orchestrator.record_guardrail_violation'):
            
            orchestrator = GuardrailOrchestrator()
            
            # Mock multiple violations
            rate_violation = GuardrailViolation(
                guardrail_type="rate_limiting",
                severity="high",
                message="Rate limit exceeded",
                details={},
                timestamp=datetime.utcnow()
            )
            
            pii_violation = GuardrailViolation(
                guardrail_type="pii_detection",
                severity="high",
                message="PII detected",
                details={},
                timestamp=datetime.utcnow()
            )
            
            orchestrator._check_rate_limit = AsyncMock(return_value=rate_violation)
            orchestrator._check_pii = AsyncMock(return_value=(pii_violation, "redacted"))
            orchestrator._check_toxicity = AsyncMock(return_value=None)
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            assert result.passed is False
            assert len(result.violations) == 2
    
    @pytest.mark.asyncio
    async def test_check_input_with_guardrails_disabled(self, mock_settings, sample_request):
        """Test input guardrails when all checks disabled"""
        mock_settings.enable_pii_detection = False
        mock_settings.enable_toxicity_filtering = False
        mock_settings.enable_rate_limiting = False
        
        with patch('src.guardrails.orchestrator.record_guardrail_check'):
            orchestrator = GuardrailOrchestrator()
            
            result = await orchestrator.check_input_guardrails(sample_request)
            
            # Should pass with no checks
            assert result.passed is True
            assert len(result.violations) == 0


class TestOutputGuardrails:
    """Test output guardrail checks"""
    
    @pytest.mark.asyncio
    async def test_check_output_clean_text(self, mock_settings):
        """Test output guardrails with clean text"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'):
            orchestrator = GuardrailOrchestrator()
            orchestrator._check_toxicity = AsyncMock(return_value=None)
            
            result = await orchestrator.check_output_guardrails("Clean output text", "user123")
            
            assert result.passed is True
            assert len(result.violations) == 0
            assert result.modified_content is None
    
    @pytest.mark.asyncio
    async def test_check_output_with_toxicity(self, mock_settings):
        """Test output guardrails with toxic output"""
        with patch('src.guardrails.orchestrator.record_guardrail_check'), \
             patch('src.guardrails.orchestrator.record_guardrail_violation'):
            
            orchestrator = GuardrailOrchestrator()
            
            tox_violation = GuardrailViolation(
                guardrail_type="toxicity_filtering",
                severity="high",
                message="Toxic output",
                details={},
                timestamp=datetime.utcnow()
            )
            orchestrator._check_toxicity = AsyncMock(return_value=tox_violation)
            
            result = await orchestrator.check_output_guardrails("Toxic output", "user123")
            
            assert result.passed is False
            assert len(result.violations) == 1
    
    @pytest.mark.asyncio
    async def test_check_output_when_disabled(self, mock_settings):
        """Test output guardrails when toxicity check disabled"""
        mock_settings.toxicity_check_output = False
        
        with patch('src.guardrails.orchestrator.record_guardrail_check'):
            orchestrator = GuardrailOrchestrator()
            
            result = await orchestrator.check_output_guardrails("Any text", "user123")
            
            # Should pass with no checks
            assert result.passed is True
            assert len(result.violations) == 0


class TestPrivateGuardrailMethods:
    """Test private guardrail check methods"""
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self, mock_settings, sample_request):
        """Test _check_rate_limit when allowed"""
        with patch('src.guardrails.orchestrator.get_rate_limiter') as mock_limiter:
            mock_rl = AsyncMock()
            mock_rl.check_rate_limit = AsyncMock(return_value=(True, {}))
            mock_limiter.return_value = mock_rl
            
            orchestrator = GuardrailOrchestrator()
            violation = await orchestrator._check_rate_limit(sample_request)
            
            assert violation is None
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded(self, mock_settings, sample_request):
        """Test _check_rate_limit when limit exceeded"""
        with patch('src.guardrails.orchestrator.get_rate_limiter') as mock_limiter:
            mock_rl = AsyncMock()
            mock_rl.check_rate_limit = AsyncMock(
                return_value=(False, {'minute_remaining': 0})
            )
            mock_limiter.return_value = mock_rl
            
            orchestrator = GuardrailOrchestrator()
            violation = await orchestrator._check_rate_limit(sample_request)
            
            assert violation is not None
            assert violation.guardrail_type == "rate_limiting"
            assert violation.severity == "high"
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_error(self, mock_settings, sample_request):
        """Test _check_rate_limit handles errors gracefully"""
        with patch('src.guardrails.orchestrator.get_rate_limiter') as mock_limiter:
            mock_limiter.side_effect = Exception("Redis error")
            
            orchestrator = GuardrailOrchestrator()
            violation = await orchestrator._check_rate_limit(sample_request)
            
            # Should return None on error, not crash
            assert violation is None
    
    @pytest.mark.asyncio
    async def test_check_pii_no_pii_detected(self, mock_settings):
        """Test _check_pii when no PII found"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.pii_detector.redact_pii = AsyncMock(
            return_value=("Clean text", [])
        )
        
        violation, redacted = await orchestrator._check_pii("Clean text")
        
        assert violation is None
        assert redacted is None
    
    @pytest.mark.asyncio
    async def test_check_pii_with_pii_detected(self, mock_settings):
        """Test _check_pii when PII is found"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.pii_detector.redact_pii = AsyncMock(
            return_value=(
                "[PERSON] lives in [LOCATION]",
                [
                    {'entity_type': 'PERSON'},
                    {'entity_type': 'LOCATION'}
                ]
            )
        )
        
        violation, redacted = await orchestrator._check_pii("John lives in NYC")
        
        assert violation is not None
        assert violation.guardrail_type == "pii_detection"
        assert redacted == "[PERSON] lives in [LOCATION]"
        assert 'entities' in violation.details
    
    @pytest.mark.asyncio
    async def test_check_pii_error_handling(self, mock_settings):
        """Test _check_pii error handling"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.pii_detector.redact_pii = AsyncMock(
            side_effect=Exception("PII detector failed")
        )
        
        violation, redacted = await orchestrator._check_pii("Some text")
        
        assert violation is not None
        assert violation.severity == "critical"
        assert violation.guardrail_type == "pii_detection"
        assert "unavailable" in violation.message
        assert redacted is None
    
    @pytest.mark.asyncio
    async def test_check_toxicity_clean_text(self, mock_settings):
        """Test _check_toxicity with clean text"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.toxicity_detector.is_toxic = AsyncMock(
            return_value=(False, {'toxicity': 0.1})
        )
        
        violation = await orchestrator._check_toxicity("Clean text")
        
        assert violation is None
    
    @pytest.mark.asyncio
    async def test_check_toxicity_toxic_text(self, mock_settings):
        """Test _check_toxicity with toxic text"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.toxicity_detector.is_toxic = AsyncMock(
            return_value=(True, {'toxicity': 0.95, 'insult': 0.9})
        )
        
        violation = await orchestrator._check_toxicity("Toxic text")
        
        assert violation is not None
        assert violation.guardrail_type == "toxicity_filtering"
        assert violation.severity == "high"
        assert 'scores' in violation.details
        assert violation.details['max_score'] == 0.95
    
    @pytest.mark.asyncio
    async def test_check_toxicity_error_handling(self, mock_settings):
        """Test _check_toxicity error handling"""
        orchestrator = GuardrailOrchestrator()
        orchestrator.toxicity_detector.is_toxic = AsyncMock(
            side_effect=Exception("Model failed")
        )
        
        violation = await orchestrator._check_toxicity("Any text")
        
        assert violation is not None
        assert violation.severity == "critical"
        assert "unavailable" in violation.message


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
