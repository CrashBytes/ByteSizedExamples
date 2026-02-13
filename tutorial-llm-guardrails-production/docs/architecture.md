# Architecture Overview

## System Architecture

The LLM Guardrails system follows a layered defense architecture with multiple independent safety checks:

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ Pre-Processing Guardrails    │
│  • Rate Limiting             │
│  • PII Detection             │
│  • Toxicity Filtering        │
│  • Input Validation          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ LLM API Call                 │
│  (OpenAI / Anthropic)        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Post-Processing Guardrails   │
│  • Output Toxicity Check     │
│  • Content Validation        │
│  • PII Redaction             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Monitoring & Audit           │
│  • Prometheus Metrics        │
│  • Structured Logging        │
│  • Audit Trail               │
└──────────────────────────────┘
```

## Component Architecture

### API Layer (`src/api/`)
- **FastAPI Application**: Async HTTP server handling requests
- **Route Handlers**: Endpoint implementations with validation
- **Middleware**: CORS, authentication, request tracking

### Guardrails Layer (`src/guardrails/`)
- **Orchestrator**: Coordinates all guardrail checks
- **PII Detector**: Microsoft Presidio for entity recognition
- **Toxicity Detector**: Detoxify models for content classification
- **Rate Limiter**: Redis-based sliding window rate limiting
- **Prompt Injection Detector**: Pattern matching for attacks

### Models Layer (`src/models/`)
- **Pydantic Schemas**: Request/response validation
- **Data Models**: Type-safe data structures

### Configuration Layer (`src/config/`)
- **Settings Management**: Environment-based configuration
- **Secrets Handling**: Secure credential management

### Monitoring Layer (`src/monitoring/`)
- **Prometheus Metrics**: Performance and violation tracking
- **Structured Logging**: JSON-formatted logs for analysis
- **Audit Trail**: Security event logging

## Data Flow

1. **Request Reception**: FastAPI receives LLM completion request
2. **Input Validation**: Pydantic validates request schema
3. **Rate Limiting**: Check user's request quota
4. **PII Detection**: Scan for personal information
5. **Toxicity Check**: Analyze input for harmful content
6. **LLM Call**: Generate completion if all checks pass
7. **Output Validation**: Check LLM response for issues
8. **Response**: Return completion or block notification
9. **Logging**: Record all decisions for audit

## Scaling Considerations

### Horizontal Scaling
- Stateless API design allows multiple replicas
- Redis provides centralized rate limiting state
- Load balancer distributes traffic across pods

### Performance Optimization
- Async operations minimize blocking
- Parallel guardrail checks reduce latency
- Caching for repeated patterns
- Model quantization for faster inference

### High Availability
- Multiple API replicas for redundancy
- Redis Sentinel for cache failover
- Health checks and automatic restarts
- Circuit breakers for external dependencies

## Security Architecture

### Defense in Depth
1. **Network Layer**: TLS encryption, firewall rules
2. **Application Layer**: Input validation, guardrails
3. **Data Layer**: Encryption at rest, PII redaction
4. **Monitoring Layer**: Audit logs, anomaly detection

### Secrets Management
- Environment variables for configuration
- Kubernetes secrets for API keys
- No hardcoded credentials in code
- Rotation policies for sensitive data

## Technology Stack

- **Framework**: FastAPI (Python 3.11+)
- **Safety**: Presidio, Detoxify
- **Caching**: Redis
- **Monitoring**: Prometheus, JSON logging
- **Deployment**: Docker, Kubernetes
- **Testing**: Pytest, httpx

## Design Decisions

### Why FastAPI?
- Excellent async support for I/O-bound operations
- Automatic OpenAPI documentation
- Native Pydantic integration for validation
- High performance comparable to Node.js

### Why Redis?
- Atomic operations for accurate rate limiting
- High throughput for frequent checks
- Simple key-value storage model
- Mature with excellent client libraries

### Why Presidio?
- Production-grade PII detection
- Extensible recognizer system
- Multiple redaction strategies
- Microsoft-maintained and supported

### Why Detoxify?
- State-of-the-art toxicity detection
- Multiple toxicity categories
- Pre-trained models ready to use
- Fast inference with transformer models

## Future Enhancements

1. **Advanced Guardrails**
   - Semantic similarity for prompt injection
   - Context-aware safety checks
   - Multi-modal content analysis

2. **Performance Improvements**
   - Model quantization and distillation
   - Response caching for common queries
   - Edge deployment for lower latency

3. **Enterprise Features**
   - Custom guardrail policies per tenant
   - Advanced analytics dashboard
   - Compliance reporting automation
   - White-label capabilities
