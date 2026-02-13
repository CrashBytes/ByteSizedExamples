"""Main FastAPI application"""
from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import logging
import os
import uuid
from datetime import datetime

# Import application components
from .config import get_settings
from .agents import (
    TranscriptionAgent,
    DiarizationAgent,
    ContextRetrievalAgent,
    SummarizationAgent,
    ActionItemsAgent
)
from .services import MeetingVectorStore, AudioStreamManager, TranscriptionPipeline
from .orchestration import MeetingWorkflow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Agentic Meeting Transcription API",
    description="Production API for AI-powered meeting transcription and analysis",
    version="1.0.0"
)

# Get settings
settings = get_settings()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instances (initialized on startup)
transcription_agent = None
diarization_agent = None
context_agent = None
summarization_agent = None
action_items_agent = None
vector_store = None
workflow = None


@app.on_event("startup")
async def startup_event():
    """Initialize agents on startup"""
    global transcription_agent, diarization_agent, context_agent
    global summarization_agent, action_items_agent, vector_store, workflow
    
    logger.info("Initializing agents...")
    
    try:
        # Initialize agents
        transcription_agent = TranscriptionAgent(
            model_size=settings.whisper_model_size,
            device=settings.whisper_device
        )
        
        diarization_agent = DiarizationAgent(
            auth_token=settings.huggingface_token,
            device=settings.whisper_device
        )
        
        vector_store = MeetingVectorStore(
            qdrant_url=settings.qdrant_url,
            collection_name=settings.qdrant_collection_name,
            embedding_model=settings.embedding_model,
            api_key=settings.qdrant_api_key
        )
        
        context_agent = ContextRetrievalAgent(vector_store)
        
        summarization_agent = SummarizationAgent(
            model_name=settings.openai_model,
            temperature=settings.openai_temperature
        )
        
        action_items_agent = ActionItemsAgent(
            model_name=settings.openai_model
        )
        
        # Initialize workflow
        workflow = MeetingWorkflow(
            transcription_agent=transcription_agent,
            diarization_agent=diarization_agent,
            context_agent=context_agent,
            summarization_agent=summarization_agent,
            action_items_agent=action_items_agent,
            vector_store=vector_store
        )
        
        logger.info("All agents initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize agents: {e}")
        raise


# Request/Response models
class ProcessMeetingRequest(BaseModel):
    """Request to process a meeting"""
    audio_url: Optional[str] = None
    title: Optional[str] = None
    participants: Optional[List[str]] = None
    metadata: Optional[Dict] = None


class ProcessMeetingResponse(BaseModel):
    """Response from meeting processing"""
    meeting_id: str
    status: str
    transcript: List[Dict]
    summaries: Dict[str, str]
    action_items: List[Dict]
    num_speakers: int


class MeetingSummaryRequest(BaseModel):
    """Request for meeting summary"""
    detail_level: str = "medium"  # brief, medium, detailed


# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Agentic Meeting Transcription API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agents": {
            "transcription": "ready" if transcription_agent else "not initialized",
            "diarization": "ready" if diarization_agent else "not initialized",
            "summarization": "ready" if summarization_agent else "not initialized",
            "action_items": "ready" if action_items_agent else "not initialized"
        },
        "services": {
            "vector_store": "ready" if vector_store else "not initialized",
            "workflow": "ready" if workflow else "not initialized"
        }
    }


@app.post("/api/meetings/process", response_model=ProcessMeetingResponse)
async def process_meeting(request: ProcessMeetingRequest):
    """
    Process meeting audio through complete agentic workflow
    
    Returns:
        Complete meeting analysis including transcript, summaries, and action items
    """
    if not workflow:
        raise HTTPException(status_code=503, detail="Workflow not initialized")
    
    if not request.audio_url:
        raise HTTPException(status_code=400, detail="audio_url is required")
    
    try:
        # Generate meeting ID
        meeting_id = str(uuid.uuid4())
        
        # Prepare metadata
        metadata = request.metadata or {}
        metadata.update({
            "title": request.title,
            "participants": request.participants or [],
            "processed_at": datetime.utcnow().isoformat()
        })
        
        # Process meeting through workflow
        logger.info(f"Processing meeting {meeting_id}")
        result = await workflow.process_meeting(
            meeting_id=meeting_id,
            audio_file=request.audio_url,
            metadata=metadata
        )
        
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract speaker count
        num_speakers = result.get("diarization", {}).get("num_speakers", 0)
        
        return ProcessMeetingResponse(
            meeting_id=meeting_id,
            status=result["status"],
            transcript=result["attributed_transcript"],
            summaries=result["summaries"],
            action_items=result["action_items"],
            num_speakers=num_speakers
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Meeting processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/meetings/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio file for processing
    
    Returns:
        File path and meeting ID
    """
    try:
        # Generate unique filename
        meeting_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_path = f"/tmp/meetings/{meeting_id}{file_extension}"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Audio file uploaded: {file_path}")
        
        return {
            "meeting_id": meeting_id,
            "file_path": file_path,
            "filename": file.filename,
            "size": len(content)
        }
    
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    Real-time transcription via WebSocket
    
    Accepts audio stream and returns transcription chunks in real-time
    """
    await websocket.accept()
    
    if not transcription_agent:
        await websocket.close(code=1011, reason="Transcription agent not initialized")
        return
    
    try:
        stream_manager = AudioStreamManager(
            sample_rate=settings.audio_sample_rate,
            chunk_duration=settings.audio_chunk_duration
        )
        audio_stream = stream_manager.stream_audio(websocket)
        pipeline = TranscriptionPipeline(transcription_agent)
        
        async for result in pipeline.process_stream(audio_stream):
            await websocket.send_json(result)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason=str(e))


@app.get("/api/meetings/search")
async def search_meetings(query: str, limit: int = 5):
    """
    Search historical meetings by semantic similarity
    
    Args:
        query: Search query
        limit: Maximum number of results
        
    Returns:
        List of relevant meeting segments
    """
    if not context_agent:
        raise HTTPException(status_code=503, detail="Context agent not initialized")
    
    try:
        results = await context_agent.retrieve_context(
            query=query,
            limit=limit
        )
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level.lower()
    )
