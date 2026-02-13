# Production-Ready LLM Guardrails Tutorial

Enterprise-grade LLM safety guardrails implementation with Python, FastAPI, and comprehensive monitoring.

## Tutorial Overview

This repository accompanies the [CrashBytes tutorial](https://crashbytes.com/articles/tutorial-production-llm-guardrails-python-fastapi-2025/) on building production-ready LLM guardrails.

### Features

- **Multi-Layer Defense**: PII detection, toxicity filtering, rate limiting, prompt injection detection
- **Production-Ready**: Async FastAPI architecture with <50ms p95 latency
- **Comprehensive Monitoring**: Prometheus metrics and structured logging
- **Enterprise-Grade**: Docker/Kubernetes deployment configurations
- **Fully Tested**: Unit and integration test suites

## Quick Start

### Prerequisites

- Python 3.11+
- Docker (optional)
- Redis (for rate limiting)

### Installation

```bash
# Clone the repository
git clone git@github.com-crashbytes:CrashBytes/tutorial-llm-guardrails-production.git
cd tutorial-llm-guardrails-production

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download required models
python -m spacy download en_core_web_lg

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

```bash
# Start Redis (in separate terminal or as service)
brew services start redis

# Run the application
uvicorn src.api.main:app --reload --port 8000

# Visit http://localhost:8000/docs for API documentation
```

## Tutorial Content

Read the complete tutorial at: [crashbytes.com/tutorial-production-llm-guardrails-python-fastapi-2025](https://crashbytes.com/articles/tutorial-production-llm-guardrails-python-fastapi-2025/)

## Architecture

```
User Input → Pre-Processing Guardrails → LLM API → Post-Processing Guardrails → User Output
              ↓                           ↓            ↓
         Rate Limiter              Prompt Filter    Content Filter
         PII Detector              Cost Monitor     Toxicity Scorer
         Input Validator                            PII Redactor
              ↓                                           ↓
         Prometheus Metrics ← Logging & Audit Trail → Redis Cache
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test suite
pytest tests/unit/
pytest tests/integration/
```

## Docker Deployment

```bash
# Build image
docker build -t llm-guardrails:latest .

# Run container
docker run -p 8000:8000 --env-file .env llm-guardrails:latest
```

## Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f deployment/kubernetes/

# Check deployment
kubectl get pods -l app=llm-guardrails
```

## Monitoring

- Prometheus metrics available at `/metrics`
- Health check at `/health`
- API documentation at `/docs`

## Security Considerations

- All sensitive data (API keys, credentials) must be in environment variables
- PII is automatically detected and redacted
- Rate limiting prevents abuse
- Comprehensive audit logging enabled

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Configuration Guide](docs/configuration.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

This is a tutorial repository. For questions or improvements:
1. Read the [full tutorial](https://crashbytes.com/articles/tutorial-production-llm-guardrails-python-fastapi-2025/)
2. Open an issue with your question
3. Submit a PR with improvements

## License

MIT License - see [LICENSE](LICENSE) file for details

## Related Resources

- [CrashBytes Blog](https://crashbytes.com)
- [AI Governance Framework Guide](https://crashbytes.com/ai-governance-framework-implementation-strategic-vp-guide-regulatory-compliance-risk-management-enterprise-transformation-2025)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Presidio Documentation](https://microsoft.github.io/presidio/)

## Author

**Michael Eakins**
- Website: [crashbytes.com](https://crashbytes.com)
- GitHub: [@CrashBytes](https://github.com/CrashBytes)

---

If you find this tutorial helpful, please star the repository!
