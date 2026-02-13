"""
Integration tests for LangGraph workflow orchestration in graph.py

Tests cover all workflow nodes, state management, and error handling
to achieve 100% coverage of orchestration/graph.py
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from app.orchestration.graph import MeetingWorkflow
from app.orchestration.state import MeetingState


@pytest.fixture
def mock_agents():
    """Create mock agents for workflow"""
    return {
        "transcription": Mock(),
        "diarization": Mock(),
        "context": Mock(),
        "summarization": Mock(),
        "action_items": Mock(),
        "vector_store": Mock()
    }


@pytest.fixture
def workflow(mock_agents):
    """Create workflow with mock agents"""
    return MeetingWorkflow(
        transcription_agent=mock_agents["transcription"],
        diarization_agent=mock_agents["diarization"],
        context_agent=mock_agents["context"],
        summarization_agent=mock_agents["summarization"],
        action_items_agent=mock_agents["action_items"],
        vector_store=mock_agents["vector_store"]
    )


@pytest.fixture
def sample_state():
    """Create sample meeting state"""
    return MeetingState(
        meeting_id="test-meeting-123",
        audio_file="/tmp/test_audio.wav",
        transcript={},
        diarization={},
        attributed_transcript=[],
        context=[],
        summaries={},
        action_items=[],
        status="pending",
        error=None,
        metadata={"title": "Test Meeting"}
    )


class TestMeetingWorkflowInit:
    """Tests for workflow initialization"""
    
    def test_workflow_initialization(self, workflow, mock_agents):
        """Test workflow is properly initialized"""
        assert workflow.transcription_agent == mock_agents["transcription"]
        assert workflow.diarization_agent == mock_agents["diarization"]
        assert workflow.context_agent == mock_agents["context"]
        assert workflow.summarization_agent == mock_agents["summarization"]
        assert workflow.action_items_agent == mock_agents["action_items"]
        assert workflow.vector_store == mock_agents["vector_store"]
        assert workflow.workflow is not None
    
    def test_workflow_build(self, workflow):
        """Test workflow graph is built correctly"""
        assert workflow.workflow is not None


class TestTranscriptionNode:
    """Tests for transcription node"""
    
    @pytest.mark.asyncio
    async def test_transcribe_node_success(self, workflow, sample_state):
        """Test successful transcription"""
        workflow.transcription_agent.transcribe_file = AsyncMock(return_value={
            "segments": [{"text": "Hello world", "start": 0.0, "end": 1.5}],
            "text": "Hello world"
        })
        
        result = await workflow._transcribe_node(sample_state)
        
        assert result["status"] == "transcribed"
        assert "segments" in result["transcript"]
        assert result["error"] is None
        workflow.transcription_agent.transcribe_file.assert_called_once_with(sample_state["audio_file"])
    
    @pytest.mark.asyncio
    async def test_transcribe_node_failure(self, workflow, sample_state):
        """Test transcription node when error occurs"""
        workflow.transcription_agent.transcribe_file = AsyncMock(
            side_effect=Exception("Audio file not found")
        )
        
        result = await workflow._transcribe_node(sample_state)
        
        assert "Transcription failed" in result["error"]
        assert "Audio file not found" in result["error"]


class TestDiarizationNode:
    """Tests for diarization node"""
    
    @pytest.mark.asyncio
    async def test_diarize_node_success(self, workflow, sample_state):
        """Test successful diarization"""
        workflow.diarization_agent.diarize = AsyncMock(return_value={
            "num_speakers": 2,
            "segments": [
                {"speaker": "Speaker 1", "start": 0.0, "end": 2.0},
                {"speaker": "Speaker 2", "start": 2.5, "end": 4.0}
            ]
        })
        
        result = await workflow._diarize_node(sample_state)
        
        assert result["status"] == "diarized"
        assert result["diarization"]["num_speakers"] == 2
        assert result["error"] is None
    
    @pytest.mark.asyncio
    async def test_diarize_node_failure(self, workflow, sample_state):
        """Test diarization node when error occurs"""
        workflow.diarization_agent.diarize = AsyncMock(
            side_effect=Exception("Model not loaded")
        )
        
        result = await workflow._diarize_node(sample_state)
        
        assert "Diarization failed" in result["error"]
        assert "Model not loaded" in result["error"]


class TestMergeNode:
    """Tests for merge node"""
    
    @pytest.mark.asyncio
    async def test_merge_node_success(self, workflow, sample_state):
        """Test successful transcript merge"""
        sample_state["transcript"] = {
            "segments": [{"text": "Hello", "start": 0.0, "end": 1.0}]
        }
        sample_state["diarization"] = {
            "segments": [{"speaker": "Speaker 1", "start": 0.0, "end": 1.0}]
        }
        
        with patch("app.orchestration.graph.TranscriptAssembler.merge_transcripts") as mock_merge:
            mock_merge.return_value = [
                {"text": "Hello", "speaker": "Speaker 1", "start": 0.0, "end": 1.0}
            ]
            
            result = await workflow._merge_node(sample_state)
            
            assert result["status"] == "merged"
            assert len(result["attributed_transcript"]) == 1
            assert result["error"] is None
            mock_merge.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_merge_node_failure(self, workflow, sample_state):
        """Test merge node when error occurs"""
        sample_state["transcript"] = {}
        sample_state["diarization"] = {}
        
        with patch("app.orchestration.graph.TranscriptAssembler.merge_transcripts",
                   side_effect=Exception("Invalid data")):
            result = await workflow._merge_node(sample_state)
            
            assert "Merge failed" in result["error"]
            assert "Invalid data" in result["error"]


class TestContextNode:
    """Tests for context retrieval node"""
    
    @pytest.mark.asyncio
    async def test_context_node_success(self, workflow, sample_state):
        """Test successful context retrieval"""
        sample_state["attributed_transcript"] = [
            {"text": "Discussing project deadlines", "speaker": "Speaker 1"}
        ]
        
        workflow.context_agent.retrieve_context = AsyncMock(return_value=[
            {"text": "Previous deadline discussion", "score": 0.9}
        ])
        
        result = await workflow._context_node(sample_state)
        
        assert result["status"] == "context_retrieved"
        assert len(result["context"]) == 1
        assert result["error"] is None
    
    @pytest.mark.asyncio
    async def test_context_node_failure(self, workflow, sample_state):
        """Test context node when error occurs"""
        sample_state["attributed_transcript"] = [{"text": "Test"}]
        
        workflow.context_agent.retrieve_context = AsyncMock(
            side_effect=Exception("Vector store unavailable")
        )
        
        result = await workflow._context_node(sample_state)
        
        assert "Context retrieval failed" in result["error"]
        assert result["context"] == []



class TestSummarizeNode:
    """Tests for summarization node"""
    
    @pytest.mark.asyncio
    async def test_summarize_node_success(self, workflow, sample_state):
        """Test successful summarization"""
        sample_state["attributed_transcript"] = [{"text": "Meeting content"}]
        sample_state["context"] = []
        
        workflow.summarization_agent.summarize = AsyncMock(return_value={
            "brief": "Short summary",
            "medium": "Medium summary",
            "detailed": "Detailed summary"
        })
        
        result = await workflow._summarize_node(sample_state)
        
        assert result["status"] == "summarized"
        assert "brief" in result["summaries"]
        assert result["error"] is None
    
    @pytest.mark.asyncio
    async def test_summarize_node_failure(self, workflow, sample_state):
        """Test summarization node when error occurs"""
        sample_state["attributed_transcript"] = []
        
        workflow.summarization_agent.summarize = AsyncMock(
            side_effect=Exception("API rate limit")
        )
        
        result = await workflow._summarize_node(sample_state)
        
        assert "Summarization failed" in result["error"]
        assert result["summaries"] == {}


class TestActionsNode:
    """Tests for action items extraction node"""
    
    @pytest.mark.asyncio
    async def test_actions_node_success(self, workflow, sample_state):
        """Test successful action items extraction"""
        sample_state["attributed_transcript"] = [
            {"text": "John will review the proposal by Friday"}
        ]
        
        mock_action_item = Mock()
        mock_action_item.dict = Mock(return_value={
            "task": "Review proposal",
            "assignee": "John",
            "deadline": "Friday"
        })
        
        workflow.action_items_agent.extract_action_items = AsyncMock(
            return_value=[mock_action_item]
        )
        
        result = await workflow._actions_node(sample_state)
        
        assert result["status"] == "actions_extracted"
        assert len(result["action_items"]) == 1
        assert result["error"] is None
    
    @pytest.mark.asyncio
    async def test_actions_node_failure(self, workflow, sample_state):
        """Test actions node when error occurs"""
        sample_state["attributed_transcript"] = []
        
        workflow.action_items_agent.extract_action_items = AsyncMock(
            side_effect=Exception("Parsing error")
        )
        
        result = await workflow._actions_node(sample_state)
        
        assert "Action items extraction failed" in result["error"]
        assert result["action_items"] == []


class TestStoreNode:
    """Tests for vector store node"""
    
    @pytest.mark.asyncio
    async def test_store_node_success(self, workflow, sample_state):
        """Test successful vector storage"""
        sample_state["attributed_transcript"] = [{"text": "Content"}]
        sample_state["metadata"] = {"title": "Test Meeting"}
        
        workflow.vector_store.store_meeting = AsyncMock()
        
        result = await workflow._store_node(sample_state)
        
        assert result["status"] == "complete"
        assert result["error"] is None
        workflow.vector_store.store_meeting.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_store_node_failure(self, workflow, sample_state):
        """Test store node when error occurs"""
        sample_state["attributed_transcript"] = []
        
        workflow.vector_store.store_meeting = AsyncMock(
            side_effect=Exception("Database error")
        )
        
        result = await workflow._store_node(sample_state)
        
        assert "Vector storage failed" in result["error"]


class TestProcessMeeting:
    """Tests for complete process_meeting workflow"""
    
    @pytest.mark.asyncio
    async def test_process_meeting_complete_success(self, workflow):
        """Test complete meeting processing workflow"""
        with patch.object(workflow.workflow, 'ainvoke', new_callable=AsyncMock) as mock_invoke:
            mock_invoke.return_value = {
                "meeting_id": "test-123",
                "status": "complete",
                "attributed_transcript": [{"text": "Hello"}],
                "summaries": {"brief": "Summary"},
                "action_items": [],
                "error": None
            }
            
            result = await workflow.process_meeting(
                meeting_id="test-123",
                audio_file="/tmp/test.wav",
                metadata={"title": "Test"}
            )
            
            assert result["status"] == "complete"
            assert result["meeting_id"] == "test-123"
            mock_invoke.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_process_meeting_with_metadata(self, workflow):
        """Test process_meeting with custom metadata"""
        with patch.object(workflow.workflow, 'ainvoke', new_callable=AsyncMock) as mock_invoke:
            mock_invoke.return_value = {"status": "complete", "meeting_id": "test-456"}
            
            metadata = {"department": "Engineering", "priority": "high"}
            result = await workflow.process_meeting(
                meeting_id="test-456",
                audio_file="/tmp/test.wav",
                metadata=metadata
            )
            
            call_args = mock_invoke.call_args[0][0]
            assert call_args["metadata"]["department"] == "Engineering"
            assert call_args["metadata"]["priority"] == "high"
    
    @pytest.mark.asyncio
    async def test_process_meeting_no_metadata(self, workflow):
        """Test process_meeting without metadata"""
        with patch.object(workflow.workflow, 'ainvoke', new_callable=AsyncMock) as mock_invoke:
            mock_invoke.return_value = {"status": "complete"}
            
            result = await workflow.process_meeting(
                meeting_id="test-789",
                audio_file="/tmp/test.wav"
            )
            
            call_args = mock_invoke.call_args[0][0]
            assert call_args["metadata"] == {}
