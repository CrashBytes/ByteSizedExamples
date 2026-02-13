# Production AI Reasoning Systems

[![Tests](https://github.com/CrashBytes/tutorial-production-ai-reasoning/workflows/Tests/badge.svg)](https://github.com/CrashBytes/tutorial-production-ai-reasoning/actions)
[![codecov](https://codecov.io/gh/CrashBytes/tutorial-production-ai-reasoning/branch/main/graph/badge.svg)](https://codecov.io/gh/CrashBytes/tutorial-production-ai-reasoning)

A production-ready implementation of AI reasoning systems with chain-of-thought prompting, intelligent strategy selection, cost monitoring, and enterprise deployment patterns.

## Overview

This tutorial demonstrates how to build AI reasoning systems that intelligently route requests to appropriate reasoning strategies, saving 40-60% on costs while maintaining quality. Learn when chain-of-thought adds value and when it doesn't, based on research from Wharton, McKinsey, and Google.

**Related Article**: [Production AI Reasoning Systems: When Chain-of-Thought Actually Matters](https://crashbytes.com/tutorial-production-ai-reasoning-systems-chain-of-thought-2025)

## Key Features

- **Intelligent Task Classification**: Automatically determines if reasoning is needed
- **Multiple Reasoning Strategies**: Direct, CoT, Tree-of-Thoughts, Self-Consistency, Extended Thinking
- **Cost Monitoring**: Real-time tracking with budget alerts and optimization recommendations
- **Production-Ready**: FastAPI, Docker, comprehensive testing, observability
- **Cost Optimization**: Save 40-60% by routing simple queries to direct inference

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/CrashBytes/tutorial-production-ai-reasoning.git
cd tutorial-production-ai-reasoning

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Running Locally

```bash
# Start the API server
uvicorn app.main:app --reload

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## Usage Examples

### Basic Reasoning Request

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/reason",
    json={
        "prompt": "Calculate the compound interest on $10,000 at 5% annual rate for 3 years",
        "strategy": "auto"  # Automatically selects best strategy
    }
)

result = response.json()
print(f"Strategy used: {result['result']['strategy_used']}")
print(f"Cost: ${result['result']['cost_usd']:.4f}")
print(f"Answer: {result['result']['final_answer']}")
```

## Reasoning Strategies

| Strategy | Cost | Time | Use When |
|----------|------|------|----------|
| **Direct** | $0.002 | 800ms | Simple queries, classification, fact retrieval |
| **Chain-of-Thought** | $0.015 | 4.5s | Complex multi-step problems, analysis |
| **Tree-of-Thoughts** | $0.045 | 12s | Critical decisions, exploring multiple approaches |
| **Extended Thinking** | $0.080 | 25s | Maximum quality, expert-level reasoning |

## License

MIT License

## Support

- **Tutorial Article**: [crashbytes.com](https://crashbytes.com/tutorial-production-ai-reasoning-systems-chain-of-thought-2025)
- **CrashBytes Blog**: [crashbytes.com](https://crashbytes.com)

---

**Last Updated**: November 18, 2025
