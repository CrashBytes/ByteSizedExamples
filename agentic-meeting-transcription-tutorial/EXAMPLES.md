# Example Usage Guide

This guide provides practical examples of using the Agentic Meeting Transcription System.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [WebSocket Audio Streaming](#websocket-audio-streaming)
3. [Meeting Analysis](#meeting-analysis)
4. [RAG Context Retrieval](#rag-context-retrieval)
5. [Python Client Library](#python-client-library)
6. [Advanced Workflows](#advanced-workflows)

## Basic Usage

### 1. Create a Meeting

```bash
curl -X POST http://localhost:8000/api/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Strategy Meeting",
    "participants": ["alice@company.com", "bob@company.com", "carol@company.com"]
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Product Strategy Meeting",
  "participants": ["alice@company.com", "bob@company.com", "carol@company.com"],
  "status": "created",
  "created_at": "2025-10-22T10:30:00Z"
}
```

### 2. Upload Audio File

```bash
# Upload a WAV file (16kHz, mono recommended)
curl -X POST http://localhost:8000/api/meetings/550e8400-e29b-41d4-a716-446655440000/upload-audio \
  -F "audio=@meeting.wav"
```

### 3. Get Meeting Summary

```bash
# Brief summary
curl http://localhost:8000/api/meetings/550e8400-e29b-41d4-a716-446655440000/summary?detail=brief

# Medium summary (default)
curl http://localhost:8000/api/meetings/550e8400-e29b-41d4-a716-446655440000/summary?detail=medium

# Detailed summary
curl http://localhost:8000/api/meetings/550e8400-e29b-41d4-a716-446655440000/summary?detail=detailed
```

### 4. Get Action Items

```bash
curl http://localhost:8000/api/meetings/550e8400-e29b-41d4-a716-446655440000/action-items
```

Response:
```json
[
  {
    "task": "Prepare Q4 roadmap presentation",
    "assignee": "Alice",
    "deadline": "Friday, October 25",
    "priority": "high"
  },
  {
    "task": "Review competitor analysis document",
    "assignee": "Bob",
    "deadline": "Next Monday",
    "priority": "medium"
  }
]
```

## WebSocket Audio Streaming

Real-time audio streaming for live transcription:

```javascript
// JavaScript WebSocket client
const ws = new WebSocket('ws://localhost:8000/ws/meetings/550e8400-e29b-41d4-a716-446655440000/audio');

// Handle connection
ws.onopen = () => {
  console.log('WebSocket connected');
};

// Send audio chunks
const sendAudioChunk = (audioData) => {
  ws.send(audioData);  // Send ArrayBuffer or Blob
};

// Receive transcription results
ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Transcription:', result.text);
  console.log('Speaker:', result.speaker);
  console.log('Timestamp:', result.start, '-', result.end);
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Close connection
ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Python WebSocket Client

```python
import asyncio
import websockets
import wave

async def stream_audio(meeting_id: str, audio_file: str):
    """Stream audio file to meeting transcription service."""
    uri = f"ws://localhost:8000/ws/meetings/{meeting_id}/audio"
    
    async with websockets.connect(uri) as websocket:
        # Open audio file
        with wave.open(audio_file, 'rb') as wf:
            # Stream in chunks
            chunk_size = 1024
            while True:
                data = wf.readframes(chunk_size)
                if not data:
                    break
                
                # Send audio chunk
                await websocket.send(data)
                
                # Receive transcription (non-blocking)
                try:
                    result = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=0.1
                    )
                    print(f"Transcription: {result}")
                except asyncio.TimeoutError:
                    continue

# Usage
asyncio.run(stream_audio(
    "550e8400-e29b-41d4-a716-446655440000",
    "meeting.wav"
))
```

## Meeting Analysis

### Analyze Multiple Meetings

```python
import requests

def analyze_meeting(meeting_id: str):
    """Get complete meeting analysis."""
    base_url = "http://localhost:8000/api/meetings"
    
    # Get meeting details
    meeting = requests.get(f"{base_url}/{meeting_id}").json()
    
    # Get summary
    summary = requests.get(
        f"{base_url}/{meeting_id}/summary",
        params={"detail": "detailed"}
    ).json()
    
    # Get action items
    actions = requests.get(
        f"{base_url}/{meeting_id}/action-items"
    ).json()
    
    return {
        "meeting": meeting,
        "summary": summary,
        "action_items": actions
    }

# Analyze multiple meetings
meeting_ids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440111"
]

analyses = [analyze_meeting(mid) for mid in meeting_ids]

# Print summaries
for analysis in analyses:
    print(f"\n=== {analysis['meeting']['title']} ===")
    print(f"Summary: {analysis['summary']['summary']}")
    print(f"Action Items: {len(analysis['action_items'])}")
```

## RAG Context Retrieval

Retrieve relevant context from past meetings:

```python
from app.agents.context_retrieval_agent import ContextRetrievalAgent

# Initialize agent
agent = ContextRetrievalAgent()

# Retrieve context
context = await agent.retrieve_context(
    query="What did we discuss about the API refactor?",
    limit=5
)

# Process results
for result in context:
    print(f"Meeting: {result['meeting_id']}")
    print(f"Relevance: {result['score']:.2f}")
    print(f"Excerpt: {result['transcript'][:200]}...")
    print("---")
```

### Search Meeting History

```bash
# Search via API (coming soon)
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pricing strategy discussion",
    "limit": 10
  }'
```

## Python Client Library

Complete Python client for the API:

```python
import httpx
from typing import List, Optional

class MeetingClient:
    """Client for Meeting Transcription API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def create_meeting(
        self, 
        title: str,
        participants: List[str]
    ) -> dict:
        """Create a new meeting."""
        response = await self.client.post(
            f"{self.base_url}/api/meetings",
            json={"title": title, "participants": participants}
        )
        return response.json()
    
    async def upload_audio(
        self, 
        meeting_id: str,
        audio_path: str
    ) -> dict:
        """Upload audio file for processing."""
        with open(audio_path, 'rb') as f:
            files = {"audio": f}
            response = await self.client.post(
                f"{self.base_url}/api/meetings/{meeting_id}/upload-audio",
                files=files
            )
        return response.json()
    
    async def get_summary(
        self, 
        meeting_id: str,
        detail: str = "medium"
    ) -> dict:
        """Get meeting summary."""
        response = await self.client.get(
            f"{self.base_url}/api/meetings/{meeting_id}/summary",
            params={"detail": detail}
        )
        return response.json()
    
    async def get_action_items(self, meeting_id: str) -> List[dict]:
        """Get meeting action items."""
        response = await self.client.get(
            f"{self.base_url}/api/meetings/{meeting_id}/action-items"
        )
        return response.json()

# Usage
async def main():
    client = MeetingClient()
    
    # Create meeting
    meeting = await client.create_meeting(
        title="Weekly Standup",
        participants=["team@company.com"]
    )
    
    # Upload audio
    await client.upload_audio(
        meeting["id"],
        "standup.wav"
    )
    
    # Get results
    summary = await client.get_summary(meeting["id"])
    actions = await client.get_action_items(meeting["id"])
    
    print(f"Summary: {summary['summary']}")
    print(f"Action Items: {len(actions)}")

# Run
import asyncio
asyncio.run(main())
```

## Advanced Workflows

### Batch Processing

Process multiple meetings in parallel:

```python
import asyncio
from pathlib import Path

async def process_meeting_batch(audio_directory: str):
    """Process all audio files in a directory."""
    client = MeetingClient()
    audio_files = Path(audio_directory).glob("*.wav")
    
    async def process_one(audio_path):
        # Create meeting
        meeting = await client.create_meeting(
            title=audio_path.stem,
            participants=[]
        )
        
        # Upload and process
        await client.upload_audio(meeting["id"], str(audio_path))
        
        # Get results
        summary = await client.get_summary(meeting["id"])
        return meeting["id"], summary
    
    # Process in parallel
    results = await asyncio.gather(*[
        process_one(audio_file) 
        for audio_file in audio_files
    ])
    
    return results

# Usage
results = asyncio.run(process_meeting_batch("./meetings/"))
```

### Custom Analysis Pipeline

Create custom analysis workflow:

```python
from app.orchestration.graph import MeetingOrchestrator
from app.agents.summarization_agent import SummarizationAgent

async def custom_analysis(meeting_id: str, audio_path: str):
    """Run custom analysis pipeline."""
    orchestrator = MeetingOrchestrator()
    
    # Process meeting
    result = await orchestrator.process_meeting(meeting_id, audio_path)
    
    # Custom post-processing
    summarizer = SummarizationAgent()
    
    # Generate multiple summary levels
    summaries = {}
    for level in ["brief", "medium", "detailed"]:
        summary = await summarizer.generate_summary(
            result["transcript"],
            detail_level=level
        )
        summaries[level] = summary
    
    return {
        "transcript": result["transcript"],
        "summaries": summaries,
        "action_items": result["action_items"],
        "context": result["context"]
    }
```

### Integration with Calendar

Automatic meeting transcription from calendar:

```python
# Pseudo-code for calendar integration
from datetime import datetime, timedelta

async def monitor_calendar_meetings():
    """Monitor calendar and auto-transcribe meetings."""
    client = MeetingClient()
    
    while True:
        # Check for meetings in next 5 minutes
        upcoming = get_calendar_events(
            start=datetime.now(),
            end=datetime.now() + timedelta(minutes=5)
        )
        
        for event in upcoming:
            # Create meeting
            meeting = await client.create_meeting(
                title=event.title,
                participants=event.attendees
            )
            
            # Start recording (using system audio capture)
            audio_stream = start_audio_recording()
            
            # Stream to API
            await stream_audio_to_meeting(meeting["id"], audio_stream)
        
        # Check every minute
        await asyncio.sleep(60)
```

## Tips and Best Practices

### Audio Quality
- Use 16kHz sample rate for best results
- Mono audio is sufficient (stereo will be converted)
- Minimize background noise
- Ensure clear speaker audio

### Performance
- Process shorter meetings (<30 min) for faster results
- Use 'brief' summaries for quick overviews
- Enable caching for frequently accessed meetings
- Process in batches during off-peak hours

### Error Handling
- Always check API response status codes
- Implement retry logic for transient failures
- Log errors for debugging
- Validate audio format before uploading

---

For more examples, see the [GitHub repository](https://github.com/CrashBytes/agentic-meeting-transcription-tutorial) and [full documentation](README.md).
