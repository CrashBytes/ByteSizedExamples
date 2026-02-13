"""Integration tests for the complete meeting processing pipeline"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.orchestration.state import MeetingState
from app.agents.transcription_agent import TranscriptionAgent
from app.agents.diarization_agent import DiarizationAgent
from app.agents.summarization_agent import SummarizationAgent
from app.agents.action_items_agent import ActionItemsAgent
from app.services.audio_processor import TranscriptAssembler
from app.services.vector_store import MeetingVectorStore


# Mock classes to replace pyannote.core (Python 3.14 compatibility)
class MockSegment:
    def __init__(self, start, end):
        self.start = start
        self.end = end


class MockAnnotation:
    def __init__(self):
        self.tracks = []
    
    def __setitem__(self, segment, speaker):
        self.tracks.append((segment, speaker))
    
    def itertracks(self, yield_label=False):
        """Mock itertracks to return (segment, track_id, speaker)"""
        for segment, speaker in self.tracks:
            yield (segment, None, speaker)


@pytest.mark.integration
class TestMeetingProcessingPipeline:
    """Integration tests for complete meeting processing workflow"""
    
    @pytest.fixture
    def transcription_agent(self, mock_whisper_model):
        """Create TranscriptionAgent with mocked model"""
        with patch('app.agents.transcription_agent.whisper.load_model', return_value=mock_whisper_model):
            agent = TranscriptionAgent(model_size="tiny", device="cpu")
        return agent
    
    @pytest.fixture
    def diarization_agent(self, mock_pyannote_pipeline):
        """Create DiarizationAgent with mocked pipeline"""
        with patch('app.agents.diarization_agent.Pipeline.from_pretrained', return_value=mock_pyannote_pipeline):
            agent = DiarizationAgent(auth_token="test-token", device="cpu")
        return agent
    
    @pytest.fixture
    def summarization_agent(self, mock_openai_client):
        """Create SummarizationAgent with mocked LLM"""
        with patch('app.agents.summarization_agent.ChatOpenAI', return_value=mock_openai_client):
            agent = SummarizationAgent()
        return agent
    
    @pytest.fixture
    def action_items_agent(self, mock_openai_client):
        """Create ActionItemsAgent with mocked LLM"""
        with patch('app.agents.action_items_agent.ChatOpenAI', return_value=mock_openai_client):
            agent = ActionItemsAgent()
        return agent
    
    @pytest.fixture
    def vector_store(self, mock_qdrant_client, mock_sentence_transformer):
        """Create MeetingVectorStore with mocks"""
        with patch('app.services.vector_store.QdrantClient', return_value=mock_qdrant_client):
            with patch('app.services.vector_store.SentenceTransformer', return_value=mock_sentence_transformer):
                store = MeetingVectorStore()
        return store
    
    @pytest.mark.asyncio
    async def test_complete_pipeline_success(
        self,
        test_audio_file,
        transcription_agent,
        diarization_agent,
        summarization_agent,
        action_items_agent,
        vector_store,
        sample_whisper_result,
        sample_diarization_result
    ):
        """Test complete end-to-end processing pipeline"""
        # Setup mocks for full pipeline
        transcription_agent.model.transcribe = Mock(return_value=sample_whisper_result)
        
        annotation = MockAnnotation()
        annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
        diarization_agent.pipeline = Mock(return_value=annotation)
        
        summarization_agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Meeting summary about authentication module"
        ))
        
        from app.agents.action_items_agent import ActionItemsList, ActionItem
        action_items_agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Complete authentication module",
                    assignee="SPEAKER_00",
                    due_date="Friday",
                    priority="high",
                    context="Deadline discussed"
                )
            ]
        ))
        action_items_agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        # Step 1: Transcription
        transcription = await transcription_agent.transcribe_file(str(test_audio_file))
        assert transcription["text"] != ""
        
        # Step 2: Diarization
        diarization = await diarization_agent.diarize(str(test_audio_file))
        assert len(diarization["speakers"]) > 0
        
        # Step 3: Merge transcription and diarization
        attributed_transcript = TranscriptAssembler.merge_transcripts(
            transcription,
            diarization
        )
        assert len(attributed_transcript) > 0
        assert "speaker" in attributed_transcript[0]
        
        # Step 4: Summarization
        summaries = await summarization_agent.summarize(
            attributed_transcript,
            detail_level="all"
        )
        assert "brief" in summaries
        assert "medium" in summaries
        assert "detailed" in summaries
        
        # Step 5: Action items extraction
        action_items = await action_items_agent.extract_action_items(attributed_transcript)
        assert len(action_items) > 0
        assert action_items[0].description == "Complete authentication module"
        
        # Step 6: Store in vector database
        await vector_store.store_meeting(
            meeting_id="integration-test-123",
            transcript=attributed_transcript,
            metadata={"test": True}
        )
        vector_store.client.upsert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_pipeline_with_empty_audio(
        self,
        transcription_agent,
        diarization_agent
    ):
        """Test pipeline handles empty/silent audio"""
        transcription_agent.model.transcribe = Mock(return_value={
            "text": "",
            "language": "en",
            "segments": []
        })
        
        diarization_agent.pipeline = Mock(return_value=MockAnnotation())
        
        transcription = await transcription_agent.transcribe_file("empty.wav")
        diarization = await diarization_agent.diarize("empty.wav")
        
        attributed = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        assert attributed == []
    
    @pytest.mark.asyncio
    async def test_pipeline_with_failed_diarization(
        self,
        transcription_agent,
        diarization_agent,
        sample_whisper_result
    ):
        """Test pipeline continues when diarization fails"""
        transcription_agent.model.transcribe = Mock(return_value=sample_whisper_result)
        diarization_agent.pipeline = Mock(side_effect=Exception("Diarization failed"))
        
        transcription = await transcription_agent.transcribe_file("test.wav")
        diarization = await diarization_agent.diarize("test.wav")
        
        # Should have error in diarization
        assert "error" in diarization
        
        # But can still merge with empty diarization
        attributed = TranscriptAssembler.merge_transcripts(transcription, diarization)
        assert all(seg["speaker"] == "Unknown" for seg in attributed)
    
    @pytest.mark.asyncio
    async def test_state_management_through_pipeline(
        self,
        test_audio_file,
        transcription_agent,
        diarization_agent,
        sample_whisper_result,
        sample_diarization_result
    ):
        """Test MeetingState tracks pipeline progress"""
        state = MeetingState(
            meeting_id="state-test-123",
            audio_file=str(test_audio_file),
            status="processing"
        )
        
        # Transcription step
        transcription_agent.model.transcribe = Mock(return_value=sample_whisper_result)
        state["transcript"] = await transcription_agent.transcribe_file(state["audio_file"])
        assert "transcript" in state
        
        # Diarization step
        annotation = MockAnnotation()
        annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
        diarization_agent.pipeline = Mock(return_value=annotation)
        state["diarization"] = await diarization_agent.diarize(state["audio_file"])
        assert "diarization" in state
        
        # Assembly step
        state["attributed_transcript"] = TranscriptAssembler.merge_transcripts(
            state["transcript"],
            state["diarization"]
        )
        assert "attributed_transcript" in state
        assert len(state["attributed_transcript"]) > 0
        
        state["status"] = "completed"
        assert state["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_concurrent_agent_execution(
        self,
        transcription_agent,
        summarization_agent,
        action_items_agent,
        sample_transcript
    ):
        """Test multiple agents can process concurrently"""
        import asyncio
        
        summarization_agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Summary"
        ))
        
        from app.agents.action_items_agent import ActionItemsList
        action_items_agent.parser.parse = Mock(return_value=ActionItemsList(items=[]))
        action_items_agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        # Run summarization and action extraction concurrently
        results = await asyncio.gather(
            summarization_agent.summarize(sample_transcript, detail_level="brief"),
            action_items_agent.extract_action_items(sample_transcript)
        )
        
        summaries, action_items = results
        assert "brief" in summaries
        assert isinstance(action_items, list)
    
    @pytest.mark.asyncio
    async def test_error_recovery_in_pipeline(
        self,
        transcription_agent,
        diarization_agent,
        summarization_agent,
        sample_whisper_result
    ):
        """Test pipeline can recover from individual component failures"""
        # Transcription succeeds
        transcription_agent.model.transcribe = Mock(return_value=sample_whisper_result)
        transcription = await transcription_agent.transcribe_file("test.wav")
        
        # Diarization succeeds
        annotation = MockAnnotation()
        annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
        diarization_agent.pipeline = Mock(return_value=annotation)
        diarization = await diarization_agent.diarize("test.wav")
        
        attributed = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        # Summarization fails
        summarization_agent.llm.ainvoke = AsyncMock(side_effect=Exception("API Error"))
        summaries = await summarization_agent.summarize(attributed, detail_level="brief")
        
        # Should have error message
        assert "Error" in summaries.get("brief", "")
        
        # But we still have transcription and diarization
        assert len(attributed) > 0
    
    @pytest.mark.asyncio
    async def test_vector_store_integration_with_agents(
        self,
        vector_store,
        sample_transcript,
        mock_sentence_transformer
    ):
        """Test vector store integrates correctly with agent outputs"""
        import numpy as np
        
        mock_sentence_transformer.encode.return_value = np.random.rand(384)
        
        # Store meeting
        await vector_store.store_meeting(
            meeting_id="vector-test-123",
            transcript=sample_transcript,
            metadata={"participants": ["Alice", "Bob"]}
        )
        
        # Verify all segments were stored
        call_args = vector_store.client.upsert.call_args[1]
        points = call_args["points"]
        
        assert len(points) == len(sample_transcript)
        
        # Verify payload structure matches expected format
        for i, point in enumerate(points):
            assert point.payload["meeting_id"] == "vector-test-123"
            assert point.payload["segment_index"] == i
            assert point.payload["text"] == sample_transcript[i]["text"]
            assert point.payload["speaker"] == sample_transcript[i]["speaker"]
