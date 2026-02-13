# Deployment Guide

Complete guide for deploying the AI Agent system to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Providers](#cloud-providers)
- [Monitoring Setup](#monitoring-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Python 3.11+** for local development
- **Docker** and **Docker Compose** for containerized deployment
- **Kubernetes cluster** (v1.24+) for production deployment
- **OpenAI API key** or **Anthropic API key**
- **Redis** instance for short-term memory
- **PostgreSQL** database for long-term storage

### Optional

- **kubectl** CLI tool
- **Helm** for Kubernetes package management
- **Terraform** for infrastructure as code
- **Cloud provider CLI** (AWS CLI, gcloud, az)

---

## Local Deployment

### Step 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production.git
cd crashbytes-tutorial-ai-agents-langchain-production

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

**Minimum required configuration:**
```env
OPENAI_API_KEY=your_openai_key_here
POSTGRES_PASSWORD=your_secure_password
```

### Step 3: Start Infrastructure

```bash
# Start Redis and PostgreSQL
docker-compose up -d redis postgres

# Wait for services to be ready
sleep 10

# Initialize database
python scripts/init_db.py
```

### Step 4: Run Application

```bash
# Start API server
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Or use the shortcut
python -m src.api.main
```

### Step 5: Test

```bash
# Check health
curl http://localhost:8000/health

# Test agent
curl -X POST http://localhost:8000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?", "conversation_id": "test-123"}'
```

---

## Docker Deployment

### Quick Start

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f ai-agent

# Check status
docker-compose ps

# Stop services
docker-compose down
```

### Build Custom Image

```bash
# Build image
docker build -t ai-agent:latest .

# Run container
docker run -d \
  --name ai-agent \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -e POSTGRES_PASSWORD=your_password \
  --network host \
  ai-agent:latest
```

### Docker Compose Production

```bash
# Use production override
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale agents
docker-compose up -d --scale ai-agent=3
```

---

## Kubernetes Deployment

### Step 1: Prepare Cluster

```bash
# Create namespace
kubectl create namespace ai-agents

# Set context
kubectl config set-context --current --namespace=ai-agents
```

### Step 2: Configure Secrets

```bash
# Create secrets for API keys
kubectl create secret generic llm-secrets \
  --from-literal=openai-key='your-openai-key' \
  --from-literal=anthropic-key='your-anthropic-key' \
  -n ai-agents

# Create database secrets
kubectl create secret generic postgres-secrets \
  --from-literal=username='agent_user' \
  --from-literal=password='your-secure-password' \
  --from-literal=database='agent_db' \
  -n ai-agents
```

### Step 3: Deploy Infrastructure

```bash
# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
```

### Step 4: Initialize Database

```bash
# Run init job
kubectl apply -f k8s/init-db-job.yaml

# Check job status
kubectl get jobs
kubectl logs -l job-name=init-db
```

### Step 5: Deploy Application

```bash
# Deploy agent
kubectl apply -f k8s/deployment.yaml

# Deploy service & ingress
kubectl apply -f k8s/service.yaml

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get services
```

### Step 6: Verify Deployment

```bash
# Check pod status
kubectl get pods -l app=ai-agent

# Check logs
kubectl logs -l app=ai-agent --tail=100 -f

# Check service
kubectl get svc ai-agent-service

# Port forward for testing
kubectl port-forward svc/ai-agent-service 8000:80

# Test
curl http://localhost:8000/health
```

### Step 7: Configure Autoscaling

```bash
# Apply HPA
kubectl apply -f k8s/service.yaml

# Check HPA status
kubectl get hpa

# Monitor scaling
watch kubectl get hpa ai-agent-hpa
```

---

## Cloud Providers

### AWS (EKS)

```bash
# Create EKS cluster
eksctl create cluster \
  --name ai-agent-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5

# Configure kubectl
aws eks update-kubeconfig --name ai-agent-cluster --region us-east-1

# Deploy application
kubectl apply -f k8s/
```

### Google Cloud (GKE)

```bash
# Create GKE cluster
gcloud container clusters create ai-agent-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 5

# Get credentials
gcloud container clusters get-credentials ai-agent-cluster --zone us-central1-a

# Deploy application
kubectl apply -f k8s/
```

### Azure (AKS)

```bash
# Create AKS cluster
az aks create \
  --resource-group ai-agent-rg \
  --name ai-agent-cluster \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 5

# Get credentials
az aks get-credentials --resource-group ai-agent-rg --name ai-agent-cluster

# Deploy application
kubectl apply -f k8s/
```

---

## Monitoring Setup

### Prometheus & Grafana

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Default credentials: admin/prom-operator
```

### Application Metrics

```bash
# Check metrics endpoint
curl http://localhost:8000/metrics

# Add ServiceMonitor for Prometheus
kubectl apply -f k8s/monitoring/servicemonitor.yaml
```

---

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check resource usage
kubectl top pods
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgres-service -U agent_user -d agent_db

# Check secrets
kubectl get secret postgres-secrets -o yaml
```

#### Redis Connection Issues

```bash
# Test Redis connectivity
kubectl run -it --rm debug --image=redis:7 --restart=Never -- \
  redis-cli -h redis-service ping

# Check Redis logs
kubectl logs -l app=redis
```

#### High Memory Usage

```bash
# Check memory usage
kubectl top pods

# Increase memory limits in deployment.yaml
# Then apply changes
kubectl apply -f k8s/deployment.yaml
```

#### LLM API Rate Limits

```bash
# Check error logs
kubectl logs -l app=ai-agent | grep "rate limit"

# Implement exponential backoff in code
# Or add rate limiting at ingress level
```

### Debugging Commands

```bash
# Interactive shell in pod
kubectl exec -it <pod-name> -- /bin/bash

# Copy files from pod
kubectl cp <pod-name>:/app/logs ./logs

# View resource usage
kubectl top pods
kubectl top nodes

# Check network policies
kubectl get networkpolicies

# View all resources
kubectl get all -n ai-agents
```

---

## Production Checklist

- [ ] API keys stored in secrets manager (not plaintext)
- [ ] TLS/SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting configured
- [ ] Backup strategy for PostgreSQL
- [ ] Log aggregation configured
- [ ] Autoscaling enabled
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Network policies applied
- [ ] RBAC configured
- [ ] Pod security policies enabled
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Security scanning completed

---

## Next Steps

1. Configure custom domain and TLS
2. Set up CI/CD pipeline
3. Implement advanced monitoring
4. Configure log aggregation
5. Set up automated backups
6. Implement disaster recovery
7. Performance optimization
8. Security hardening

---

For more information, see:
- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Contributing Guide](../CONTRIBUTING.md)
