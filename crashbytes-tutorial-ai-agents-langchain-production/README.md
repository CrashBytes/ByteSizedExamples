# Production AI Agents with LangChain & Kubernetes

[![Tutorial](https://img.shields.io/badge/Tutorial-crashbytes.com-blue)](https://crashbytes.com/articles/tutorial-ai-agents-langchain-production-kubernetes-deployment-2025)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://www.python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-0.1.0-orange)](https://python.langchain.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Complete implementation of **production-ready AI agents** using LangChain, with tool integration, persistent memory, error handling, monitoring, and Kubernetes deployment.

## What You'll Learn

- Build **multi-step reasoning agents** with LangChain
- Implement **tool integration** (APIs, databases, search)
- Add **persistent memory** (Redis + PostgreSQL)
- Deploy to **Kubernetes** with horizontal scaling
- Add **monitoring & observability** (Prometheus, OpenTelemetry)
- Handle **errors gracefully** with retry logic
- Create **production-grade APIs** with FastAPI

## Architecture

```
User Request → FastAPI → Agent Executor → LLM + Tools → Response
                              ↓              ↓
                        Memory Store    Tool Registry
                              ↓              ↓
                        Redis/Postgres  External APIs
                              ↓
                        Monitoring & Logging
```

**Key Features:**
- Stateless agent execution for horizontal scaling
- Tool registry pattern for dynamic tool loading
- Pluggable memory backends (Redis, PostgreSQL)
- Async-first design for high throughput
- Comprehensive error handling and retries
- Production monitoring and tracing

## Prerequisites

- **Python 3.10+** with async programming knowledge
- **Docker** and **Kubernetes** basics
- **LLM fundamentals** and prompting experience
- **REST API** development experience
- **OpenAI** or **Anthropic** API key

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production.git
cd crashbytes-tutorial-ai-agents-langchain-production

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start Infrastructure

```bash
# Start Redis and PostgreSQL
docker-compose up -d

# Initialize database
python scripts/init_db.py
```

### 4. Run the Agent

```bash
# Start API server
uvicorn src.api.main:app --reload

# Or use the CLI
python src/cli.py "Search for Python tutorials and summarize the top 3"
```

### 5. Test the System

```bash
# Run tests
pytest

# Test API endpoint
curl -X POST http://localhost:8000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "What is LangChain?", "conversation_id": "test-1"}'
```

## Project Structure

```
.
├── src/
│   ├── agents/          # Agent executor and configuration
│   │   ├── __init__.py
│   │   ├── config.py    # Settings and configuration
│   │   ├── executor.py  # Main agent execution logic
│   │   └── prompts.py   # Agent system prompts
│   ├── tools/           # Tool implementations
│   │   ├── __init__.py
│   │   ├── base_tool.py    # Base tool with validation
│   │   ├── search_tool.py  # Web search tool
│   │   ├── weather_tool.py # Weather API tool
│   │   └── database_tool.py # Database query tool
│   ├── memory/          # Memory management
│   │   ├── __init__.py
│   │   ├── redis_memory.py      # Redis conversation memory
│   │   ├── postgres_memory.py   # PostgreSQL long-term storage
│   │   └── memory_manager.py    # Unified memory interface
│   └── api/             # FastAPI application
│       ├── __init__.py
│       ├── main.py      # API endpoints
│       ├── models.py    # Request/response models
│       └── middleware.py # Monitoring middleware
├── tests/               # Test suite
│   ├── test_agent.py
│   ├── test_tools.py
│   ├── test_memory.py
│   └── test_api.py
├── k8s/                 # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── redis.yaml
│   └── secrets.yaml
├── docs/                # Documentation
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── API.md
├── scripts/             # Utility scripts
│   ├── init_db.py
│   └── test_tools.py
├── docker-compose.yml   # Local infrastructure
├── Dockerfile           # Container image
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Core Components

### Agent Executor

The `AgentExecutor` orchestrates LLM calls with tools and memory:

```python
from src.agents.executor import AgentExecutor
from src.tools import WebSearchTool, WeatherTool

# Initialize agent with tools
tools = [WebSearchTool(), WeatherTool()]
agent = AgentExecutor(tools=tools, model="gpt-4-turbo-preview")

# Execute with conversation context
response = await agent.execute(
    query="What's the weather in San Francisco?",
    conversation_id="user-123"
)
```

### Tool System

All tools inherit from `BaseTool` with built-in validation and monitoring:

```python
from src.tools.base_tool import BaseTool

class CustomTool(BaseTool):
    name = "custom_tool"
    description = "Description for the agent"
    
    async def _execute(self, **kwargs):
        # Tool implementation
        return {"result": "success"}
```

### Memory Management

Dual-layer memory system (short-term + long-term):

```python
from src.memory import MemoryManager

memory = MemoryManager(redis_url="redis://localhost", postgres_dsn="...")

# Add message
await memory.add_message("conv-123", "user", "Hello!")

# Retrieve history
history = await memory.get_history("conv-123", limit=10)
```

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t ai-agent:latest .

# Run with docker-compose
docker-compose up
```

### docker-compose.yml includes:
- AI Agent API (port 8000)
- Redis (port 6379)
- PostgreSQL (port 5432)
- Prometheus (port 9090)

## Kubernetes Deployment

### Deploy to Cluster

```bash
# Create namespace
kubectl create namespace ai-agents

# Apply secrets (edit with your values first)
kubectl apply -f k8s/secrets.yaml

# Deploy infrastructure
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/postgres.yaml

# Deploy agent
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n ai-agents
```

### Horizontal Scaling

```bash
# Scale up
kubectl scale deployment ai-agent --replicas=5 -n ai-agents

# Auto-scaling
kubectl autoscale deployment ai-agent \
  --min=3 --max=10 \
  --cpu-percent=70 \
  -n ai-agents
```

## Monitoring & Observability

### Metrics

Prometheus metrics exposed at `/metrics`:
- `agent_execution_duration_seconds` - Agent execution time
- `tool_execution_count` - Tool usage counter
- `memory_operations_total` - Memory operation count
- `llm_api_calls_total` - LLM API call count

### Logging

Structured JSON logging with correlation IDs:

```python
logger.info(
    "Agent execution started",
    extra={
        "conversation_id": "conv-123",
        "query": "user query",
        "correlation_id": "req-456"
    }
)
```

### Tracing

OpenTelemetry integration for distributed tracing:

```bash
# Export OTLP endpoint
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Traces sent automatically
```

## Testing

```bash
# Run all tests
pytest

# Run specific test suite
pytest tests/test_agent.py -v

# Run with coverage
pytest --cov=src --cov-report=html
```

### Test Categories
- **Unit tests**: Individual component testing
- **Integration tests**: Multi-component interactions
- **End-to-end tests**: Full agent workflow
- **Load tests**: Performance and scalability

## API Documentation

### Execute Agent Request

```bash
POST /agent/execute
Content-Type: application/json

{
  "query": "Search for Python tutorials",
  "conversation_id": "user-123",
  "metadata": {
    "user_id": "user-456"
  }
}
```

**Response:**

```json
{
  "success": true,
  "response": "I found several Python tutorials...",
  "tools_used": ["web_search"],
  "execution_time_ms": 1234.56,
  "conversation_id": "user-123"
}
```

### Complete API Docs

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Security Considerations

- **API Keys**: Store in environment variables or secrets manager
- **Input Validation**: All tool inputs validated before execution
- **Rate Limiting**: Implement rate limits on API endpoints
- **Tool Sandboxing**: Isolate tool execution environments
- **Audit Logging**: Track all agent actions for compliance

## Advanced Topics

### Custom Tool Development

See `docs/CUSTOM_TOOLS.md` for creating domain-specific tools.

### Multi-Agent Systems

See `docs/MULTI_AGENT.md` for agent coordination patterns.

### Streaming Responses

See `docs/STREAMING.md` for implementing SSE responses.

## Troubleshooting

### Common Issues

**Agent not using tools:**
- Check tool descriptions are clear
- Verify LLM supports tool use (GPT-4, Claude 3)
- Review agent prompts

**Memory not persisting:**
- Verify Redis/PostgreSQL connections
- Check TTL settings
- Review memory manager logs

**Slow performance:**
- Enable response caching
- Run tools in parallel where possible
- Scale horizontally with Kubernetes

## Related Tutorials

- [LLM Guardrails Tutorial](https://crashbytes.com/tutorial-production-llm-guardrails-python-fastapi-2025)
- [MLOps Pipeline Tutorial](https://crashbytes.com/tutorial-mlops-pipeline-kubernetes-production-deployment-2025)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- **Tutorial**: [Full walkthrough on crashbytes.com](https://crashbytes.com/articles/tutorial-ai-agents-langchain-production-kubernetes-deployment-2025)
- **Issues**: [GitHub Issues](https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production/issues)
- **Discussions**: [GitHub Discussions](https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production/discussions)

---

**Built by** [Crashbytes](https://crashbytes.com)

**Star this repo** if you found it helpful!
