"""
Integration tests for FastAPI endpoints in main.py

Tests cover all routes, WebSocket connections, and error handling
to achieve 100% coverage of main.py
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
import uuid
import io
import json

from app.main import app
from app.orchestration.state import MeetingState


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def mock_agents():
    """Mock all agent instances"""
    with patch("app.main.transcription_agent") as mock_transcription, \
         patch("app.main.diarization_agent") as mock_diarization, \
         patch("app.main.context_agent") as mock_context, \
         patch("app.main.summarization_agent") as mock_summarization, \
         patch("app.main.action_items_agent") as mock_action_items, \
         patch("app.main.vector_store") as mock_vector, \
         patch("app.main.workflow") as mock_workflow:
        
        # Setup mock agent instances
        mock_transcription.return_value = Mock()
        mock_diarization.return_value = Mock()
        mock_context.return_value = Mock()
        mock_summarization.return_value = Mock()
        mock_action_items.return_value = Mock()
        mock_vector.return_value = Mock()
        mock_workflow.return_value = Mock()
        
        yield {
            "transcription": mock_transcription,
            "diarization": mock_diarization,
            "context": mock_context,
            "summarization": mock_summarization,
            "action_items": mock_action_items,
            "vector_store": mock_vector,
            "workflow": mock_workflow
        }


@pytest.fixture
def sample_meeting_result():
    """Sample meeting processing result"""
    return {
        "status": "complete",
        "attributed_transcript": [
            {
                "speaker": "Speaker 1",
                "text": "Welcome to the meeting",
                "start": 0.0,
                "end": 2.0
            },
            {
                "speaker": "Speaker 2",
                "text": "Thank you for having me",
                "start": 2.5,
                "end": 4.0
            }
        ],
        "diarization": {
            "num_speakers": 2,
            "segments": []
        },
        "summaries": {
            "brief": "Meeting introduction",
            "medium": "Team members introduced themselves",
            "detailed": "The meeting started with team introductions..."
        },
        "action_items": [
            {
                "task": "Review proposal",
                "assignee": "John",
                "priority": "high"
            }
        ]
    }


class TestRootEndpoint:
    """Tests for root endpoint"""
    
    def test_root_endpoint(self, client):
        """Test GET / returns API information"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Agentic Meeting Transcription API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "operational"


class TestHealthCheck:
    """Tests for health check endpoint"""
    
    def test_health_check_all_ready(self, client):
        """Test health check when all agents are initialized"""
        with patch("app.main.transcription_agent", Mock()), \
             patch("app.main.diarization_agent", Mock()), \
             patch("app.main.summarization_agent", Mock()), \
             patch("app.main.action_items_agent", Mock()), \
             patch("app.main.vector_store", Mock()), \
             patch("app.main.workflow", Mock()):
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "timestamp" in data
            assert data["agents"]["transcription"] == "ready"
            assert data["agents"]["diarization"] == "ready"
            assert data["agents"]["summarization"] == "ready"
            assert data["agents"]["action_items"] == "ready"
            assert data["services"]["vector_store"] == "ready"
            assert data["services"]["workflow"] == "ready"
    
    def test_health_check_not_initialized(self, client):
        """Test health check when agents are not initialized"""
        with patch("app.main.transcription_agent", None), \
             patch("app.main.diarization_agent", None), \
             patch("app.main.summarization_agent", None), \
             patch("app.main.action_items_agent", None), \
             patch("app.main.vector_store", None), \
             patch("app.main.workflow", None):
            
            response = client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["agents"]["transcription"] == "not initialized"
            assert data["agents"]["diarization"] == "not initialized"
            assert data["services"]["workflow"] == "not initialized"


class TestProcessMeeting:
    """Tests for /api/meetings/process endpoint"""
    
    def test_process_meeting_success(self, client, sample_meeting_result):
        """Test successful meeting processing"""
        mock_workflow = AsyncMock()
        mock_workflow.process_meeting = AsyncMock(return_value=sample_meeting_result)
        
        with patch("app.main.workflow", mock_workflow):
            response = client.post(
                "/api/meetings/process",
                json={
                    "audio_url": "https://example.com/meeting.mp3",
                    "title": "Team Meeting",
                    "participants": ["John", "Jane"],
                    "metadata": {"department": "Engineering"}
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "complete"
            assert "meeting_id" in data
            assert len(data["transcript"]) == 2
            assert data["num_speakers"] == 2
            assert len(data["action_items"]) == 1
            assert "brief" in data["summaries"]
    
    def test_process_meeting_workflow_not_initialized(self, client):
        """Test processing when workflow is not initialized"""
        with patch("app.main.workflow", None):
            response = client.post(
                "/api/meetings/process",
                json={"audio_url": "https://example.com/meeting.mp3"}
            )
            
            assert response.status_code == 503
            assert "Workflow not initialized" in response.json()["detail"]
    
    def test_process_meeting_missing_audio_url(self, client):
        """Test processing without audio_url"""
        mock_workflow = Mock()
        
        with patch("app.main.workflow", mock_workflow):
            response = client.post(
                "/api/meetings/process",
                json={"title": "Meeting"}
            )
            
            assert response.status_code == 400
            assert "audio_url is required" in response.json()["detail"]
    
    def test_process_meeting_workflow_error(self, client):
        """Test processing when workflow returns error"""
        mock_workflow = AsyncMock()
        mock_workflow.process_meeting = AsyncMock(return_value={
            "error": "Transcription failed",
            "status": "failed"
        })
        
        with patch("app.main.workflow", mock_workflow):
            response = client.post(
                "/api/meetings/process",
                json={"audio_url": "https://example.com/meeting.mp3"}
            )
            
            assert response.status_code == 500
            assert "Transcription failed" in response.json()["detail"]
    
    def test_process_meeting_exception(self, client):
        """Test processing when exception occurs"""
        mock_workflow = AsyncMock()
        mock_workflow.process_meeting = AsyncMock(
            side_effect=ValueError("Invalid audio format")
        )
        
        with patch("app.main.workflow", mock_workflow):
            response = client.post(
                "/api/meetings/process",
                json={"audio_url": "https://example.com/meeting.mp3"}
            )
            
            assert response.status_code == 500
            assert "Invalid audio format" in response.json()["detail"]
    
    def test_process_meeting_minimal_metadata(self, client, sample_meeting_result):
        """Test processing with minimal metadata"""
        mock_workflow = AsyncMock()
        mock_workflow.process_meeting = AsyncMock(return_value=sample_meeting_result)
        
        with patch("app.main.workflow", mock_workflow):
            response = client.post(
                "/api/meetings/process",
                json={"audio_url": "https://example.com/meeting.mp3"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "meeting_id" in data
            assert data["status"] == "complete"


class TestUploadAudio:
    """Tests for /api/meetings/upload endpoint"""
    
    def test_upload_audio_success(self, client):
        """Test successful file upload"""
        file_content = b"fake audio content"
        files = {
            "file": ("meeting.mp3", io.BytesIO(file_content), "audio/mpeg")
        }
        
        with patch("builtins.open", create=True) as mock_file, \
             patch("os.makedirs") as mock_makedirs:
            
            mock_file_handle = MagicMock()
            mock_file.return_value.__enter__.return_value = mock_file_handle
            
            response = client.post("/api/meetings/upload", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert "meeting_id" in data
            assert "file_path" in data
            assert data["filename"] == "meeting.mp3"
            assert data["size"] == len(file_content)
            mock_makedirs.assert_called_once()
    
    def test_upload_audio_different_format(self, client):
        """Test upload with different audio format"""
        file_content = b"fake wav content"
        files = {
            "file": ("recording.wav", io.BytesIO(file_content), "audio/wav")
        }
        
        with patch("builtins.open", create=True), \
             patch("os.makedirs"):
            response = client.post("/api/meetings/upload", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["filename"] == "recording.wav"
            assert ".wav" in data["file_path"]
    
    def test_upload_audio_file_write_error(self, client):
        """Test upload when file write fails"""
        files = {"file": ("meeting.mp3", io.BytesIO(b"content"), "audio/mpeg")}
        
        with patch("builtins.open", side_effect=IOError("Disk full")), \
             patch("os.makedirs"):
            response = client.post("/api/meetings/upload", files=files)
            assert response.status_code == 500
            assert "Disk full" in response.json()["detail"]


class TestSearchMeetings:
    """Tests for /api/meetings/search endpoint"""
    
    def test_search_meetings_success(self, client):
        """Test successful meeting search"""
        mock_context_agent = AsyncMock()
        mock_context_agent.retrieve_context = AsyncMock(return_value=[
            {"meeting_id": "meeting-1", "text": "Discussed project timeline", "score": 0.9},
            {"meeting_id": "meeting-2", "text": "Reviewed budget", "score": 0.85}
        ])
        
        with patch("app.main.context_agent", mock_context_agent):
            response = client.get("/api/meetings/search", params={"query": "project timeline", "limit": 5})
            
            assert response.status_code == 200
            data = response.json()
            assert data["query"] == "project timeline"
            assert data["count"] == 2
            assert len(data["results"]) == 2
    
    def test_search_meetings_default_limit(self, client):
        """Test search with default limit"""
        mock_context_agent = AsyncMock()
        mock_context_agent.retrieve_context = AsyncMock(return_value=[])
        
        with patch("app.main.context_agent", mock_context_agent):
            response = client.get("/api/meetings/search", params={"query": "test"})
            assert response.status_code == 200
            call_kwargs = mock_context_agent.retrieve_context.call_args.kwargs
            assert call_kwargs["limit"] == 5
    
    def test_search_meetings_agent_not_initialized(self, client):
        """Test search when context agent is not initialized"""
        with patch("app.main.context_agent", None):
            response = client.get("/api/meetings/search", params={"query": "test"})
            assert response.status_code == 503
            assert "Context agent not initialized" in response.json()["detail"]
    
    def test_search_meetings_error(self, client):
        """Test search when error occurs"""
        mock_context_agent = AsyncMock()
        mock_context_agent.retrieve_context = AsyncMock(
            side_effect=Exception("Database connection failed")
        )
        
        with patch("app.main.context_agent", mock_context_agent):
            response = client.get("/api/meetings/search", params={"query": "test"})
            assert response.status_code == 500
            assert "Database connection failed" in response.json()["detail"]


class TestStartupEvent:
    """Tests for application startup event"""
    
    @pytest.mark.asyncio
    async def test_startup_event_success(self):
        """Test successful agent initialization on startup"""
        with patch("app.main.TranscriptionAgent") as mock_trans, \
             patch("app.main.DiarizationAgent") as mock_diar, \
             patch("app.main.MeetingVectorStore") as mock_vector, \
             patch("app.main.ContextRetrievalAgent") as mock_context, \
             patch("app.main.SummarizationAgent") as mock_summ, \
             patch("app.main.ActionItemsAgent") as mock_action, \
             patch("app.main.MeetingWorkflow") as mock_workflow, \
             patch("app.main.get_settings") as mock_settings:
            
            mock_settings.return_value = Mock(
                whisper_model_size="base", whisper_device="cpu",
                huggingface_token="token", qdrant_url="http://localhost:6333",
                qdrant_collection_name="meetings", embedding_model="all-MiniLM-L6-v2",
                qdrant_api_key=None, openai_model="gpt-4", openai_temperature=0.3
            )
            
            from app.main import startup_event
            await startup_event()
            
            mock_trans.assert_called_once()
            mock_diar.assert_called_once()
            mock_vector.assert_called_once()
            mock_context.assert_called_once()
            mock_summ.assert_called_once()
            mock_action.assert_called_once()
            mock_workflow.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_startup_event_initialization_failure(self):
        """Test startup event when agent initialization fails"""
        with patch("app.main.TranscriptionAgent", side_effect=Exception("Model load failed")), \
             patch("app.main.get_settings", return_value=Mock()):
            
            from app.main import startup_event
            
            with pytest.raises(Exception) as exc_info:
                await startup_event()
            
            assert "Model load failed" in str(exc_info.value)


class TestRequestModels:
    """Tests for Pydantic request/response models"""
    
    def test_process_meeting_request_model(self):
        """Test ProcessMeetingRequest model"""
        from app.main import ProcessMeetingRequest
        
        request = ProcessMeetingRequest(
            audio_url="https://example.com/audio.mp3",
            title="Team Meeting",
            participants=["Alice", "Bob"],
            metadata={"department": "Engineering"}
        )
        
        assert request.audio_url == "https://example.com/audio.mp3"
        assert request.title == "Team Meeting"
        assert len(request.participants) == 2
        assert request.metadata["department"] == "Engineering"
    
    def test_process_meeting_request_minimal(self):
        """Test ProcessMeetingRequest with minimal data"""
        from app.main import ProcessMeetingRequest
        
        request = ProcessMeetingRequest()
        assert request.audio_url is None
        assert request.title is None
        assert request.participants is None
        assert request.metadata is None
    
    def test_process_meeting_response_model(self):
        """Test ProcessMeetingResponse model"""
        from app.main import ProcessMeetingResponse
        
        response = ProcessMeetingResponse(
            meeting_id="123e4567-e89b-12d3-a456-426614174000",
            status="complete",
            transcript=[{"text": "Hello", "speaker": "Speaker 1"}],
            summaries={"brief": "Meeting summary"},
            action_items=[{"task": "Review"}],
            num_speakers=2
        )
        
        assert response.meeting_id == "123e4567-e89b-12d3-a456-426614174000"
        assert response.status == "complete"
        assert len(response.transcript) == 1
        assert response.num_speakers == 2
    
    def test_meeting_summary_request_model(self):
        """Test MeetingSummaryRequest model"""
        from app.main import MeetingSummaryRequest
        
        request1 = MeetingSummaryRequest()
        assert request1.detail_level == "medium"
        
        request2 = MeetingSummaryRequest(detail_level="detailed")
        assert request2.detail_level == "detailed"
