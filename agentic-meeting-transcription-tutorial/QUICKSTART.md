# Quick Start Guide

Get the Agentic Meeting Transcription System running in under 10 minutes.

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- Hugging Face account and token

## 5-Minute Setup

### 1. Clone the Repository

```bash
git clone https://github.com/CrashBytes/agentic-meeting-transcription-tutorial.git
cd agentic-meeting-transcription-tutorial
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
OPENAI_API_KEY=sk-your-key-here
HUGGINGFACE_TOKEN=hf_your-token-here
```

### 3. Start All Services

```bash
docker-compose up -d
```

This starts:
- Backend API (port 8000)
- Qdrant vector database (port 6333)
- PostgreSQL (port 5432)
- Redis cache (port 6379)

### 4. Verify Services

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "agents": {
    "transcription": "ready",
    "diarization": "ready",
    "summarization": "ready",
    "action_items": "ready"
  }
}
```

### 5. Process Your First Meeting

```bash
curl -X POST http://localhost:8000/api/meetings/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "path/to/your/meeting.mp3",
    "title": "Product Strategy Meeting",
    "participants": ["alice@example.com", "bob@example.com"]
  }'
```

## What Happens Next

The system will:
1. ✅ Transcribe the audio using Whisper
2. ✅ Identify speakers using Pyannote
3. ✅ Retrieve relevant context from past meetings
4. ✅ Generate summaries (brief, medium, detailed)
5. ✅ Extract action items with assignees
6. ✅ Store in vector database for future context

Processing time: ~2-5 minutes for a 30-minute meeting

## API Endpoints

### Process Meeting
```bash
POST /api/meetings/process
```

### Real-time Transcription
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/transcribe');
ws.send(audioData);  // Send audio as binary
```

### Search Meetings
```bash
GET /api/meetings/search?query=product+roadmap&limit=5
```

## Viewing Results

The API returns:
- **Transcript**: Full transcript with speaker labels
- **Summaries**: Brief, medium, and detailed summaries
- **Action Items**: Structured list with assignees and priorities
- **Speaker Count**: Number of participants detected

## Common Issues

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead of 8000
```

**Out of memory:**
```bash
# Reduce Whisper model size in .env
WHISPER_MODEL_SIZE=tiny  # or base (default), small, medium
```

**Slow processing:**
- Use GPU if available: Set `WHISPER_DEVICE=cuda` in `.env`
- Reduce audio quality before processing
- Use smaller Whisper model

## Next Steps

1. **Read the full tutorial**: [CrashBytes Tutorial](https://crashbytes.com/articles/tutorial-agentic-meeting-transcription-ai-agents-rag-enterprise-deployment-2025)
2. **Customize agents**: Modify agents in `backend/app/agents/`
3. **Deploy to production**: See Kubernetes manifests in `kubernetes/`
4. **Build frontend**: Coming soon in the tutorial repository

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/CrashBytes/agentic-meeting-transcription-tutorial/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CrashBytes/agentic-meeting-transcription-tutorial/discussions)
- **Tutorial**: [Full Article](https://crashbytes.com)

---

**Built by CrashBytes** | [Website](https://crashbytes.com) | [GitHub](https://github.com/CrashBytes)
