# Production Vector Database RAG Tutorial

[![Tests](https://github.com/CrashBytes/tutorial-production-vector-database-rag/workflows/Tests/badge.svg)](https://github.com/CrashBytes/tutorial-production-vector-database-rag/actions)
[![codecov](https://codecov.io/gh/CrashBytes/tutorial-production-vector-database-rag/branch/main/graph/badge.svg)](https://codecov.io/gh/CrashBytes/tutorial-production-vector-database-rag)

Complete production-ready implementation of vector databases for RAG (Retrieval-Augmented Generation) applications with both managed (Pinecone) and self-hosted (Weaviate) options.

**Associated Article**: [Building Production Vector Databases for RAG Applications](https://crashbytes.com/articles/tutorial-production-vector-database-rag-applications-pinecone-weaviate-deployment-2025/)

## Overview

This repository provides enterprise-grade vector database infrastructure for RAG applications, featuring:

- **Dual vector database support**: Pinecone (managed) and Weaviate (self-hosted)
- **Hybrid search**: Dense vectors + BM25 sparse vectors for optimal retrieval
- **Production embedding pipeline**: Document chunking, batch processing, multi-model support
- **FastAPI REST service**: Async processing with connection pooling
- **Kubernetes deployment**: StatefulSets, autoscaling, persistent storage
- **Comprehensive observability**: Metrics, structured logging, performance tracking

## Quick Start

### Prerequisites

- Python 3.10+
- Docker and Docker Compose
- Kubernetes cluster (for production deployment)
- OpenAI API key

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/CrashBytes/tutorial-production-vector-database-rag.git
cd tutorial-production-vector-database-rag

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Start local services (Weaviate + PostgreSQL)
docker-compose up -d

# Run API server
python -m src.main
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Applications                  │
│              (Chat UI, Search Interface)                │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
                   ↓
┌─────────────────────────────────────────────────────────┐
│              FastAPI Vector Search Service              │
│  ┌──────────────┬───────────────┬──────────────────┐  │
│  │  Query       │   Embedding   │   Result         │  │
│  │  Processing  │   Generation  │   Ranking        │  │
│  └──────────────┴───────────────┴──────────────────┘  │
└──────────┬────────────────┬─────────────────────────────┘
           │                │
    ┌──────↓──────┐  ┌──────↓──────┐
    │  Pinecone   │  │  Weaviate   │
    │  (Managed)  │  │(Self-hosted)│
    └─────────────┘  └──────┬──────┘
                            │
                     ┌──────↓──────┐
                     │ PostgreSQL  │
                     │ (Metadata)  │
                     └─────────────┘
```

## Core Components

### 1. Vector Store Abstraction

Unified interface supporting multiple vector databases:

```python
from src.vector_stores.pinecone_store import PineconeStore
from src.vector_stores.weaviate_store import WeaviateStore

# Pinecone (managed)
pinecone_store = PineconeStore(
    api_key="your-key",
    environment="us-east1-gcp",
    index_name="rag-vectors"
)

# Weaviate (self-hosted)
weaviate_store = WeaviateStore(
    url="http://localhost:8080",
    class_name="Document"
)
```

### 2. Embedding Pipeline

Support for multiple embedding models:

**OpenAI (recommended for production)**:
```python
from src.embeddings.openai_embedder import OpenAIEmbedder

embedder = OpenAIEmbedder(
    api_key="your-key",
    model="text-embedding-3-large",
    dimensions=3072
)
```

**Sentence Transformers (free, local)**:
```python
from src.embeddings.sentence_embedder import SentenceEmbedder

embedder = SentenceEmbedder(
    model_name="all-MiniLM-L6-v2"  # 384 dimensions
)
```

### 3. Document Ingestion

Complete pipeline with intelligent chunking:

```python
from src.ingestion.pipeline import IngestionPipeline

pipeline = IngestionPipeline(
    embedder=embedder,
    vector_store=vector_store
)

# Ingest documents
result = await pipeline.ingest_documents(
    documents=[
        {
            "id": "doc1",
            "text": "Document content...",
            "metadata": {"source": "manual", "category": "technical"}
        }
    ],
    namespace="production"
)
```

### 4. Hybrid Search

Combining dense and sparse vectors for optimal retrieval:

```python
# Hybrid search (Weaviate only)
results = await vector_store.hybrid_search(
    query_vector=query_embedding,
    query_text="What is RAG?",
    top_k=10,
    alpha=0.5,  # 0 = pure BM25, 1 = pure vector
    namespace="production"
)
```

## Usage Examples

### Ingesting Documents

```python
import asyncio
from examples.ingest_documents import ingest_sample_data

# Ingest sample technical documentation
asyncio.run(ingest_sample_data())
```

### Querying

```python
from examples.query_examples import semantic_search

# Semantic search
results = semantic_search(
    query="How do I implement RAG with Pinecone?",
    top_k=5
)

for result in results:
    print(f"Score: {result.score:.3f}")
    print(f"Document: {result.document[:200]}...")
    print(f"Metadata: {result.metadata}\n")
```

### API Usage

**Ingest via REST API**:
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc1",
        "text": "RAG combines retrieval with generation...",
        "metadata": {"source": "manual"}
      }
    ],
    "namespace": "production"
  }'
```

**Search via REST API**:
```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is RAG?",
    "top_k": 10,
    "search_type": "hybrid",
    "namespace": "production"
  }'
```

## Configuration

All configuration is managed via environment variables or `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSIONS=3072

# Vector Store Selection
VECTOR_STORE=weaviate  # Options: pinecone, weaviate

# Pinecone (if using)
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=rag-vectors

# Weaviate (if using)
WEAVIATE_URL=http://localhost:8080
WEAVIATE_CLASS_NAME=Document

# Search Settings
DEFAULT_TOP_K=10
DEFAULT_ALPHA=0.5  # Hybrid search weight

# Document Chunking
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# Performance
BATCH_SIZE=100
MAX_CONCURRENT_REQUESTS=100
```

## Kubernetes Deployment

Deploy to production with Kubernetes:

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/vector-api
```

Key components:
- **Weaviate StatefulSet**: 3 replicas with persistent storage
- **PostgreSQL StatefulSet**: Metadata storage
- **API Deployment**: Autoscaling FastAPI service
- **Ingress**: TLS termination and routing

## Testing

Run the test suite:

```bash
# Unit tests
pytest tests/ -v

# Integration tests
pytest tests/integration/ -v --integration

# Specific test file
pytest tests/test_vector_stores.py -v
```

## Performance Benchmarking

Benchmark query performance:

```python
from examples.benchmark import run_benchmark

# Run 1000 queries
results = run_benchmark(
    num_queries=1000,
    top_k=10
)

print(f"Average latency: {results['avg_latency_ms']}ms")
print(f"P95 latency: {results['p95_latency_ms']}ms")
print(f"P99 latency: {results['p99_latency_ms']}ms")
```

Expected performance:
- **Dense search**: 20-50ms average latency
- **Hybrid search**: 30-70ms average latency
- **Throughput**: 100+ queries/second per instance

## Project Structure

```
tutorial-production-vector-database-rag/
├── src/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── config.py                  # Configuration management
│   ├── models.py                  # Pydantic models
│   ├── vector_stores/
│   │   ├── __init__.py
│   │   ├── base.py                # Abstract base class
│   │   ├── pinecone_store.py      # Pinecone implementation
│   │   └── weaviate_store.py      # Weaviate implementation
│   ├── embeddings/
│   │   ├── __init__.py
│   │   ├── base.py                # Embedding interface
│   │   ├── openai_embedder.py     # OpenAI embeddings
│   │   └── sentence_embedder.py   # Sentence Transformers
│   ├── search/
│   │   ├── __init__.py
│   │   ├── hybrid_search.py       # Hybrid search logic
│   │   └── reranking.py           # Result reranking
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── chunker.py             # Document chunking
│   │   └── pipeline.py            # Ingestion pipeline
│   └── utils/
│       ├── __init__.py
│       ├── logging.py             # Structured logging
│       └── metrics.py             # Prometheus metrics
├── tests/
│   ├── __init__.py
│   ├── test_vector_stores.py
│   ├── test_embeddings.py
│   ├── test_search.py
│   └── integration/
│       └── test_end_to_end.py
├── k8s/
│   ├── weaviate-statefulset.yaml
│   ├── postgres-statefulset.yaml
│   ├── api-deployment.yaml
│   ├── services.yaml
│   └── ingress.yaml
├── examples/
│   ├── ingest_documents.py
│   ├── query_examples.py
│   └── benchmark.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

## Technology Stack

- **Framework**: FastAPI 0.104+
- **Vector Databases**: Pinecone 3.0, Weaviate 4.4
- **Embeddings**: OpenAI, Sentence Transformers 2.2
- **Database**: PostgreSQL 15 (metadata)
- **Container**: Docker, Kubernetes
- **Language**: Python 3.11

## Production Considerations

### Security

- Store API keys in secrets management (Kubernetes Secrets, AWS Secrets Manager)
- Enable authentication on Weaviate instances
- Use TLS for all external connections
- Implement rate limiting

### Scalability

- **Horizontal scaling**: Multiple API instances behind load balancer
- **Weaviate**: 3+ node cluster with replication
- **Connection pooling**: Managed by vector store clients
- **Batch processing**: Configurable batch sizes for ingestion

### Monitoring

- **Metrics**: Prometheus metrics at `/metrics`
- **Health checks**: `/health` endpoint with dependency checks
- **Logging**: Structured JSON logs with request tracing
- **Alerting**: Query latency, error rates, resource utilization

### Cost Optimization

**Pinecone**:
- Use Serverless for variable workloads
- Pod-based for consistent high volume
- Monitor index size and optimize dimensions if needed

**Weaviate**:
- Self-hosted = infrastructure costs only
- Right-size nodes based on vector count
- Use compression for larger datasets

## Troubleshooting

### Common Issues

**Import Errors**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Connection Errors**:
```bash
# Check services are running
docker-compose ps

# Check Weaviate health
curl http://localhost:8080/v1/meta
```

**Slow Queries**:
- Reduce `top_k` value
- Optimize metadata filters
- Check index size and consider partitioning
- Monitor network latency to vector database

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: GitHub Issues
- **Article**: [Full tutorial on CrashBytes](https://crashbytes.com/articles/tutorial-production-vector-database-rag-applications-pinecone-weaviate-deployment-2025/)
- **Email**: support@crashbytes.com

## Acknowledgments

Built by the CrashBytes Technical Team as part of our production AI infrastructure series.

---

**Production-Ready RAG Infrastructure** | Built by [CrashBytes](https://crashbytes.com)
