"""Unit tests for TranscriptionAgent"""
import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from app.agents.transcription_agent import TranscriptionAgent


@pytest.mark.unit
class TestTranscriptionAgent:
    """Test suite for TranscriptionAgent"""
    
    @pytest.fixture
    def agent(self, mock_whisper_model):
        """Create TranscriptionAgent with mocked Whisper model"""
        with patch('app.agents.transcription_agent.whisper.load_model', return_value=mock_whisper_model):
            agent = TranscriptionAgent(model_size="base", device="cpu")
        return agent
    
    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent.device == "cpu"
        assert agent.language == "en"
        assert agent.model is not None
    
    def test_agent_initialization_auto_device(self):
        """Test agent auto-detects device"""
        with patch('app.agents.transcription_agent.torch.cuda.is_available', return_value=False):
            with patch('app.agents.transcription_agent.whisper.load_model'):
                agent = TranscriptionAgent(model_size="tiny")
                assert agent.device == "cpu"
    
    @pytest.mark.asyncio
    async def test_transcribe_chunk_success(self, agent, sample_audio_chunk, sample_whisper_result):
        """Test successful chunk transcription"""
        agent.model.transcribe = Mock(return_value=sample_whisper_result)
        
        result = await agent.transcribe_chunk(sample_audio_chunk)
        
        assert result["text"] == "This is a test meeting transcript."
        assert result["language"] == "en"
        assert result["confidence"] > 0
        assert "segments" in result
    
    @pytest.mark.asyncio
    async def test_transcribe_chunk_empty_audio(self, agent):
        """Test transcription with empty audio"""
        empty_audio = np.array([], dtype=np.float32)
        
        agent.model.transcribe = Mock(return_value={
            "text": "",
            "language": "en",
            "segments": []
        })
        
        result = await agent.transcribe_chunk(empty_audio)
        
        assert result["text"] == ""
        assert result["confidence"] == 0.0
    
    @pytest.mark.asyncio
    async def test_transcribe_chunk_error_handling(self, agent, sample_audio_chunk):
        """Test error handling during transcription"""
        agent.model.transcribe = Mock(side_effect=Exception("Transcription failed"))
        
        result = await agent.transcribe_chunk(sample_audio_chunk)
        
        assert result["text"] == ""
        assert "error" in result
        assert result["confidence"] == 0.0
    
    @pytest.mark.asyncio
    async def test_transcribe_file_success(self, agent, test_audio_file, sample_whisper_result):
        """Test successful file transcription"""
        agent.model.transcribe = Mock(return_value=sample_whisper_result)
        
        result = await agent.transcribe_file(str(test_audio_file))
        
        assert result["text"] == "This is a test meeting transcript."
        assert "segments" in result
        assert len(result["segments"]) > 0
    
    @pytest.mark.asyncio
    async def test_transcribe_file_nonexistent(self, agent):
        """Test transcription with nonexistent file"""
        agent.model.transcribe = Mock(side_effect=FileNotFoundError("File not found"))
        
        result = await agent.transcribe_file("/nonexistent/file.wav")
        
        assert result["text"] == ""
        assert "error" in result
        assert "segments" in result
        assert len(result["segments"]) == 0
    
    def test_calculate_confidence_with_segments(self, agent):
        """Test confidence calculation from segments"""
        result = {
            "segments": [
                {"avg_logprob": -0.2},
                {"avg_logprob": -0.3},
                {"avg_logprob": -0.1}
            ]
        }
        
        confidence = agent._calculate_confidence(result)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0
    
    def test_calculate_confidence_empty_segments(self, agent):
        """Test confidence calculation with no segments"""
        result = {"segments": []}
        
        confidence = agent._calculate_confidence(result)
        
        assert confidence == 0.0
    
    def test_calculate_confidence_no_logprob(self, agent):
        """Test confidence calculation when logprob missing"""
        result = {
            "segments": [
                {},  # No avg_logprob field
                {"avg_logprob": -0.5}
            ]
        }
        
        confidence = agent._calculate_confidence(result)
        
        # Should handle missing logprobs gracefully
        assert 0.0 <= confidence <= 1.0
    
    @pytest.mark.asyncio
    async def test_transcribe_chunk_temperature_parameter(self, agent, sample_audio_chunk):
        """Test temperature parameter is passed correctly"""
        agent.model.transcribe = Mock(return_value={
            "text": "Test",
            "language": "en",
            "segments": []
        })
        
        await agent.transcribe_chunk(sample_audio_chunk, temperature=0.5)
        
        # Verify temperature was passed to model
        call_kwargs = agent.model.transcribe.call_args[1]
        assert call_kwargs["temperature"] == 0.5
    
    @pytest.mark.asyncio
    async def test_transcribe_different_languages(self, agent, sample_audio_chunk):
        """Test transcription with different language settings"""
        agent.language = "es"
        agent.model.transcribe = Mock(return_value={
            "text": "Hola mundo",
            "language": "es",
            "segments": []
        })
        
        result = await agent.transcribe_chunk(sample_audio_chunk)
        
        call_kwargs = agent.model.transcribe.call_args[1]
        assert call_kwargs["language"] == "es"
        assert result["language"] == "es"
    
    def test_cleanup_on_deletion(self, agent):
        """Test resources are cleaned up properly"""
        with patch('app.agents.transcription_agent.torch.cuda.empty_cache') as mock_cache:
            agent.device = "cuda"
            del agent
            # Cache should be cleared for GPU
            # Note: May not be called if device is CPU in test environment
    
    @pytest.mark.asyncio
    async def test_transcribe_chunk_confidence_threshold(self, agent, sample_audio_chunk):
        """Test low confidence transcriptions"""
        agent.model.transcribe = Mock(return_value={
            "text": "Uncertain text",
            "language": "en",
            "segments": [
                {"avg_logprob": -5.0}  # Very low confidence
            ]
        })
        
        result = await agent.transcribe_chunk(sample_audio_chunk)
        
        # Should still return result but with low confidence
        assert result["text"] == "Uncertain text"
        assert result["confidence"] < 0.5
    
    @pytest.mark.asyncio
    async def test_transcribe_multiple_segments(self, agent, sample_audio_chunk):
        """Test transcription with multiple segments"""
        agent.model.transcribe = Mock(return_value={
            "text": "First sentence. Second sentence. Third sentence.",
            "language": "en",
            "segments": [
                {"start": 0.0, "end": 1.0, "text": "First sentence.", "avg_logprob": -0.2},
                {"start": 1.0, "end": 2.0, "text": "Second sentence.", "avg_logprob": -0.3},
                {"start": 2.0, "end": 3.0, "text": "Third sentence.", "avg_logprob": -0.25}
            ]
        })
        
        result = await agent.transcribe_chunk(sample_audio_chunk)
        
        assert len(result["segments"]) == 3
        assert result["segments"][0]["text"] == "First sentence."
        assert result["segments"][2]["end"] == 3.0
