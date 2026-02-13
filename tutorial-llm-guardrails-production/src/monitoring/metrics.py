"""
Prometheus Metrics for Monitoring

Tracks guardrail performance, violations, and system health.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time


# Request metrics
requests_total = Counter(
    'guardrails_requests_total',
    'Total number of guardrail requests',
    ['endpoint', 'status']
)

requests_duration = Histogram(
    'guardrails_request_duration_seconds',
    'Request duration in seconds',
    ['endpoint']
)

# Guardrail metrics
guardrail_checks_total = Counter(
    'guardrails_checks_total',
    'Total number of guardrail checks performed',
    ['guardrail_type', 'result']
)

guardrail_violations_total = Counter(
    'guardrails_violations_total',
    'Total number of guardrail violations',
    ['guardrail_type', 'severity']
)

guardrail_check_duration = Histogram(
    'guardrails_check_duration_seconds',
    'Guardrail check duration in seconds',
    ['guardrail_type']
)

# LLM metrics
llm_requests_total = Counter(
    'llm_requests_total',
    'Total number of LLM API requests',
    ['provider', 'model', 'status']
)

llm_tokens_used = Counter(
    'llm_tokens_used_total',
    'Total tokens consumed from LLM APIs',
    ['provider', 'model']
)

# System metrics
active_requests = Gauge(
    'guardrails_active_requests',
    'Number of requests currently being processed'
)

redis_connection_status = Gauge(
    'guardrails_redis_connected',
    'Redis connection status (1=connected, 0=disconnected)'
)


def track_request_duration(endpoint: str):
    """Decorator to track request duration"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            active_requests.inc()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                requests_duration.labels(endpoint=endpoint).observe(duration)
                requests_total.labels(endpoint=endpoint, status='success').inc()
                return result
            except Exception:
                duration = time.time() - start_time
                requests_duration.labels(endpoint=endpoint).observe(duration)
                requests_total.labels(endpoint=endpoint, status='error').inc()
                raise
            finally:
                active_requests.dec()
        return wrapper
    return decorator


def record_guardrail_check(guardrail_type: str, passed: bool, duration: float):
    """Record guardrail check metrics"""
    result = 'passed' if passed else 'failed'
    guardrail_checks_total.labels(
        guardrail_type=guardrail_type,
        result=result
    ).inc()
    guardrail_check_duration.labels(
        guardrail_type=guardrail_type
    ).observe(duration)


def record_guardrail_violation(guardrail_type: str, severity: str):
    """Record guardrail violation"""
    guardrail_violations_total.labels(
        guardrail_type=guardrail_type,
        severity=severity
    ).inc()


def record_llm_request(provider: str, model: str, status: str, tokens: int = 0):
    """Record LLM API request metrics"""
    llm_requests_total.labels(
        provider=provider,
        model=model,
        status=status
    ).inc()
    
    if tokens > 0:
        llm_tokens_used.labels(
            provider=provider,
            model=model
        ).inc(tokens)


def get_metrics():
    """Get current Prometheus metrics"""
    return generate_latest()
