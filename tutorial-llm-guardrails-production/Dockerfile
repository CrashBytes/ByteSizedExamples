FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Presidio
RUN apt-get update && apt-get install -y \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download required models
RUN python -m spacy download en_core_web_lg

# Copy application code
COPY src/ ./src/

# Create non-root user for security
RUN useradd -m -u 1000 guardrails && \
    chown -R guardrails:guardrails /app
USER guardrails

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
