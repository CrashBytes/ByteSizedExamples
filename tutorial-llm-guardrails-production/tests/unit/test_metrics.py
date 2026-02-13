"""
Comprehensive tests for Prometheus Metrics

Tests all metrics tracking including:
- Request metrics
- Guardrail check metrics
- Violation metrics
- LLM API metrics
- System health metrics
"""

import pytest
from unittest.mock import AsyncMock, patch
import asyncio

from src.monitoring.metrics import (
    # Metrics
    requests_total,
    requests_duration,
    guardrail_checks_total,
    guardrail_violations_total,
    guardrail_check_duration,
    llm_requests_total,
    llm_tokens_used,
    active_requests,
    redis_connection_status,
    # Functions
    track_request_duration,
    record_guardrail_check,
    record_guardrail_violation,
    record_llm_request,
    get_metrics
)


class TestMetricDefinitions:
    """Test that all metrics are properly defined"""
    
    def test_requests_total_exists(self):
        """Test requests total counter exists"""
        assert requests_total is not None
        assert requests_total._name == 'guardrails_requests'
    
    def test_requests_duration_exists(self):
        """Test requests duration histogram exists"""
        assert requests_duration is not None
        assert requests_duration._name == 'guardrails_request_duration_seconds'
    
    def test_guardrail_checks_total_exists(self):
        """Test guardrail checks counter exists"""
        assert guardrail_checks_total is not None
        assert guardrail_checks_total._name == 'guardrails_checks'
    
    def test_guardrail_violations_total_exists(self):
        """Test violations counter exists"""
        assert guardrail_violations_total is not None
        assert guardrail_violations_total._name == 'guardrails_violations'
    
    def test_guardrail_check_duration_exists(self):
        """Test check duration histogram exists"""
        assert guardrail_check_duration is not None
        assert guardrail_check_duration._name == 'guardrails_check_duration_seconds'
    
    def test_llm_requests_total_exists(self):
        """Test LLM requests counter exists"""
        assert llm_requests_total is not None
        assert llm_requests_total._name == 'llm_requests'
    
    def test_llm_tokens_used_exists(self):
        """Test LLM tokens counter exists"""
        assert llm_tokens_used is not None
        assert llm_tokens_used._name == 'llm_tokens_used'
    
    def test_active_requests_exists(self):
        """Test active requests gauge exists"""
        assert active_requests is not None
        assert active_requests._name == 'guardrails_active_requests'
    
    def test_redis_connection_status_exists(self):
        """Test Redis connection gauge exists"""
        assert redis_connection_status is not None
        assert redis_connection_status._name == 'guardrails_redis_connected'


class TestTrackRequestDuration:
    """Test request duration tracking decorator"""
    
    @pytest.mark.asyncio
    async def test_successful_request_tracking(self):
        """Test decorator tracks successful requests"""
        @track_request_duration('test_endpoint')
        async def test_func():
            await asyncio.sleep(0.01)
            return "success"
        
        initial_count = requests_total.labels(
            endpoint='test_endpoint',
            status='success'
        )._value.get()
        
        result = await test_func()
        
        assert result == "success"
        
        new_count = requests_total.labels(
            endpoint='test_endpoint',
            status='success'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    @pytest.mark.asyncio
    async def test_failed_request_tracking(self):
        """Test decorator tracks failed requests"""
        @track_request_duration('error_endpoint')
        async def failing_func():
            raise ValueError("Test error")
        
        initial_count = requests_total.labels(
            endpoint='error_endpoint',
            status='error'
        )._value.get()
        
        with pytest.raises(ValueError):
            await failing_func()
        
        new_count = requests_total.labels(
            endpoint='error_endpoint',
            status='error'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    @pytest.mark.asyncio
    async def test_active_requests_increments(self):
        """Test active requests gauge increments during execution"""
        initial_active = active_requests._value.get()
        
        @track_request_duration('active_test')
        async def slow_func():
            # Check that active requests increased
            current_active = active_requests._value.get()
            assert current_active > initial_active
            await asyncio.sleep(0.01)
            return "done"
        
        await slow_func()
        
        # Should be back to initial after completion
        final_active = active_requests._value.get()
        assert final_active == initial_active
    
    @pytest.mark.asyncio
    async def test_active_requests_decrements_on_error(self):
        """Test active requests decrements even on error"""
        initial_active = active_requests._value.get()
        
        @track_request_duration('error_active_test')
        async def error_func():
            raise RuntimeError("Test")
        
        with pytest.raises(RuntimeError):
            await error_func()
        
        # Should be back to initial even after error
        final_active = active_requests._value.get()
        assert final_active == initial_active


class TestRecordGuardrailCheck:
    """Test guardrail check recording"""
    
    def test_record_passed_check(self):
        """Test recording a passed guardrail check"""
        initial_count = guardrail_checks_total.labels(
            guardrail_type='test_guardrail',
            result='passed'
        )._value.get()
        
        record_guardrail_check('test_guardrail', passed=True, duration=0.5)
        
        new_count = guardrail_checks_total.labels(
            guardrail_type='test_guardrail',
            result='passed'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    def test_record_failed_check(self):
        """Test recording a failed guardrail check"""
        initial_count = guardrail_checks_total.labels(
            guardrail_type='test_guardrail_fail',
            result='failed'
        )._value.get()
        
        record_guardrail_check('test_guardrail_fail', passed=False, duration=0.3)
        
        new_count = guardrail_checks_total.labels(
            guardrail_type='test_guardrail_fail',
            result='failed'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    def test_record_check_with_duration(self):
        """Test that check duration is recorded"""
        # This mainly tests that no errors occur
        record_guardrail_check('duration_test', passed=True, duration=1.23)
        
        # If we get here, it worked
        assert True
    
    def test_record_multiple_checks(self):
        """Test recording multiple checks"""
        guardrail_type = 'multi_check_test'
        
        initial_passed = guardrail_checks_total.labels(
            guardrail_type=guardrail_type,
            result='passed'
        )._value.get()
        
        initial_failed = guardrail_checks_total.labels(
            guardrail_type=guardrail_type,
            result='failed'
        )._value.get()
        
        # Record 3 passed, 2 failed
        for _ in range(3):
            record_guardrail_check(guardrail_type, passed=True, duration=0.1)
        
        for _ in range(2):
            record_guardrail_check(guardrail_type, passed=False, duration=0.2)
        
        new_passed = guardrail_checks_total.labels(
            guardrail_type=guardrail_type,
            result='passed'
        )._value.get()
        
        new_failed = guardrail_checks_total.labels(
            guardrail_type=guardrail_type,
            result='failed'
        )._value.get()
        
        assert new_passed == initial_passed + 3
        assert new_failed == initial_failed + 2


class TestRecordGuardrailViolation:
    """Test guardrail violation recording"""
    
    def test_record_violation(self):
        """Test recording a guardrail violation"""
        initial_count = guardrail_violations_total.labels(
            guardrail_type='pii_detection',
            severity='high'
        )._value.get()
        
        record_guardrail_violation('pii_detection', 'high')
        
        new_count = guardrail_violations_total.labels(
            guardrail_type='pii_detection',
            severity='high'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    def test_record_multiple_violations(self):
        """Test recording multiple violations"""
        guardrail = 'toxicity_test'
        severity = 'critical'
        
        initial_count = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity=severity
        )._value.get()
        
        # Record 5 violations
        for _ in range(5):
            record_guardrail_violation(guardrail, severity)
        
        new_count = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity=severity
        )._value.get()
        
        assert new_count == initial_count + 5
    
    def test_record_different_severities(self):
        """Test recording violations with different severities"""
        guardrail = 'multi_severity_test'
        
        initial_high = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity='high'
        )._value.get()
        
        initial_low = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity='low'
        )._value.get()
        
        record_guardrail_violation(guardrail, 'high')
        record_guardrail_violation(guardrail, 'low')
        
        new_high = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity='high'
        )._value.get()
        
        new_low = guardrail_violations_total.labels(
            guardrail_type=guardrail,
            severity='low'
        )._value.get()
        
        assert new_high == initial_high + 1
        assert new_low == initial_low + 1


class TestRecordLLMRequest:
    """Test LLM request recording"""
    
    def test_record_llm_request_without_tokens(self):
        """Test recording LLM request without token count"""
        initial_count = llm_requests_total.labels(
            provider='openai',
            model='gpt-4',
            status='success'
        )._value.get()
        
        record_llm_request('openai', 'gpt-4', 'success')
        
        new_count = llm_requests_total.labels(
            provider='openai',
            model='gpt-4',
            status='success'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    def test_record_llm_request_with_tokens(self):
        """Test recording LLM request with token count"""
        provider = 'anthropic'
        model = 'claude-3'
        
        initial_requests = llm_requests_total.labels(
            provider=provider,
            model=model,
            status='success'
        )._value.get()
        
        initial_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        record_llm_request(provider, model, 'success', tokens=150)
        
        new_requests = llm_requests_total.labels(
            provider=provider,
            model=model,
            status='success'
        )._value.get()
        
        new_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        assert new_requests == initial_requests + 1
        assert new_tokens == initial_tokens + 150
    
    def test_record_failed_llm_request(self):
        """Test recording failed LLM request"""
        initial_count = llm_requests_total.labels(
            provider='openai',
            model='gpt-3.5',
            status='error'
        )._value.get()
        
        record_llm_request('openai', 'gpt-3.5', 'error')
        
        new_count = llm_requests_total.labels(
            provider='openai',
            model='gpt-3.5',
            status='error'
        )._value.get()
        
        assert new_count == initial_count + 1
    
    def test_record_multiple_llm_requests(self):
        """Test recording multiple LLM requests with tokens"""
        provider = 'test_provider'
        model = 'test_model'
        
        initial_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        # Record 3 requests with different token counts
        record_llm_request(provider, model, 'success', tokens=100)
        record_llm_request(provider, model, 'success', tokens=200)
        record_llm_request(provider, model, 'success', tokens=150)
        
        new_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        assert new_tokens == initial_tokens + 450
    
    def test_record_request_with_zero_tokens(self):
        """Test that zero tokens doesn't increment token counter"""
        provider = 'zero_test'
        model = 'model'
        
        initial_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        record_llm_request(provider, model, 'success', tokens=0)
        
        new_tokens = llm_tokens_used.labels(
            provider=provider,
            model=model
        )._value.get()
        
        # Tokens should not increment with 0
        assert new_tokens == initial_tokens


class TestGetMetrics:
    """Test metrics export"""
    
    def test_get_metrics_returns_bytes(self):
        """Test that get_metrics returns bytes"""
        metrics = get_metrics()
        
        assert metrics is not None
        assert isinstance(metrics, bytes)
    
    def test_get_metrics_contains_metric_names(self):
        """Test that metrics output contains metric names"""
        metrics = get_metrics().decode('utf-8')
        
        # Should contain some of our metric names
        assert 'guardrails_requests_total' in metrics or 'llm_requests_total' in metrics


class TestSystemMetrics:
    """Test system-level metrics"""
    
    def test_redis_connection_status_settable(self):
        """Test Redis connection status can be set"""
        # Set to connected
        redis_connection_status.set(1)
        assert redis_connection_status._value.get() == 1
        
        # Set to disconnected
        redis_connection_status.set(0)
        assert redis_connection_status._value.get() == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
