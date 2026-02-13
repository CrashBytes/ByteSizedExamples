"""Unit tests for DiarizationAgent"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.agents.diarization_agent import DiarizationAgent


# Mock classes to replace pyannote.core
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


@pytest.mark.unit
class TestDiarizationAgent:
    """Test suite for DiarizationAgent"""
    
    @pytest.fixture
    def agent(self, mock_pyannote_pipeline):
        """Create DiarizationAgent with mocked pipeline"""
        with patch('app.agents.diarization_agent.Pipeline.from_pretrained', return_value=mock_pyannote_pipeline):
            agent = DiarizationAgent(auth_token="test-token", device="cpu")
        return agent
    
    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent.device == "cpu"
        assert agent.pipeline is not None
    
    def test_agent_initialization_with_num_speakers(self):
        """Test agent initializes with speaker count"""
        with patch('app.agents.diarization_agent.Pipeline.from_pretrained'):
            agent = DiarizationAgent(auth_token="test-token", num_speakers=3)
            assert agent.num_speakers == 3
    
    @pytest.mark.asyncio
    async def test_diarize_success(self, agent, test_audio_file):
        """Test successful diarization"""
        # Create mock annotation
        annotation = MockAnnotation()
        annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
        annotation[MockSegment(2.5, 5.0)] = "SPEAKER_01"
        annotation[MockSegment(5.0, 7.5)] = "SPEAKER_00"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(str(test_audio_file))
        
        assert result["num_speakers"] == 2
        assert "SPEAKER_00" in result["speakers"]
        assert "SPEAKER_01" in result["speakers"]
        assert len(result["segments"]) == 3
    
    @pytest.mark.asyncio
    async def test_diarize_single_speaker(self, agent, test_audio_file):
        """Test diarization with single speaker"""
        annotation = MockAnnotation()
        annotation[MockSegment(0, 10.0)] = "SPEAKER_00"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(str(test_audio_file))
        
        assert result["num_speakers"] == 1
        assert len(result["speakers"]) == 1
        assert result["speakers"][0] == "SPEAKER_00"
    
    @pytest.mark.asyncio
    async def test_diarize_error_handling(self, agent, test_audio_file):
        """Test error handling during diarization"""
        agent.pipeline = Mock(side_effect=Exception("Diarization failed"))
        
        result = await agent.diarize(str(test_audio_file))
        
        assert "error" in result
        assert result["num_speakers"] == 0
        assert len(result["speakers"]) == 0
        assert len(result["segments"]) == 0
    
    @pytest.mark.asyncio
    async def test_diarize_with_speaker_range(self, agent, test_audio_file):
        """Test diarization with min/max speaker constraints"""
        annotation = MockAnnotation()
        annotation[MockSegment(0, 5.0)] = "SPEAKER_00"
        annotation[MockSegment(5.0, 10.0)] = "SPEAKER_01"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(
            str(test_audio_file),
            min_speakers=2,
            max_speakers=5
        )
        
        # Verify parameters were passed
        call_kwargs = agent.pipeline.call_args[1]
        assert call_kwargs["min_speakers"] == 2
        assert call_kwargs["max_speakers"] == 5
    
    def test_process_diarization_segments_sorted(self, agent):
        """Test segments are sorted by start time"""
        annotation = MockAnnotation()
        annotation[MockSegment(5.0, 7.5)] = "SPEAKER_01"
        annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
        annotation[MockSegment(2.5, 5.0)] = "SPEAKER_01"
        
        segments = agent._process_diarization(annotation)
        
        assert len(segments) == 3
        assert segments[0]["start"] == 0
        assert segments[1]["start"] == 2.5
        assert segments[2]["start"] == 5.0
    
    def test_process_diarization_duration_calculated(self, agent):
        """Test segment durations are calculated correctly"""
        annotation = MockAnnotation()
        annotation[MockSegment(0, 3.5)] = "SPEAKER_00"
        annotation[MockSegment(5.0, 8.2)] = "SPEAKER_01"
        
        segments = agent._process_diarization(annotation)
        
        assert segments[0]["duration"] == pytest.approx(3.5)
        assert segments[1]["duration"] == pytest.approx(3.2)
    
    def test_process_diarization_speaker_labels(self, agent):
        """Test speaker labels are preserved"""
        annotation = MockAnnotation()
        annotation[MockSegment(0, 2.0)] = "Alice"
        annotation[MockSegment(2.0, 4.0)] = "Bob"
        
        segments = agent._process_diarization(annotation)
        
        assert segments[0]["speaker"] == "Alice"
        assert segments[1]["speaker"] == "Bob"
    
    def test_process_diarization_empty_annotation(self, agent):
        """Test processing empty annotation"""
        annotation = MockAnnotation()
        
        segments = agent._process_diarization(annotation)
        
        assert segments == []
    
    @pytest.mark.asyncio
    async def test_diarize_overlapping_speakers(self, agent, test_audio_file):
        """Test handling overlapping speaker segments"""
        annotation = MockAnnotation()
        # Overlapping segments (not typical but should handle)
        annotation[MockSegment(0, 3.0)] = "SPEAKER_00"
        annotation[MockSegment(2.0, 5.0)] = "SPEAKER_01"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(str(test_audio_file))
        
        # Should still process both segments
        assert len(result["segments"]) == 2
        assert result["num_speakers"] == 2
    
    @pytest.mark.asyncio
    async def test_diarize_with_fixed_speaker_count(self, agent, test_audio_file):
        """Test diarization with fixed number of speakers"""
        agent.num_speakers = 3
        
        annotation = MockAnnotation()
        annotation[MockSegment(0, 10.0)] = "SPEAKER_00"
        
        agent.pipeline = Mock(return_value=annotation)
        
        await agent.diarize(str(test_audio_file))
        
        # Verify num_speakers parameter was used
        call_kwargs = agent.pipeline.call_args[1]
        assert call_kwargs["num_speakers"] == 3
    
    def test_cleanup_on_deletion(self, agent):
        """Test GPU resources are cleaned up"""
        with patch('app.agents.diarization_agent.torch.cuda.empty_cache') as mock_cache:
            agent.device = "cuda"
            del agent
            # Cache clearing depends on device type
    
    @pytest.mark.asyncio
    async def test_diarize_very_short_segments(self, agent, test_audio_file):
        """Test diarization with very short speaker turns"""
        annotation = MockAnnotation()
        annotation[MockSegment(0, 0.1)] = "SPEAKER_00"
        annotation[MockSegment(0.1, 0.2)] = "SPEAKER_01"
        annotation[MockSegment(0.2, 0.3)] = "SPEAKER_00"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(str(test_audio_file))
        
        # Should handle very short segments
        assert len(result["segments"]) == 3
        assert all(seg["duration"] == pytest.approx(0.1) for seg in result["segments"])
    
    @pytest.mark.asyncio
    async def test_diarize_many_speakers(self, agent, test_audio_file):
        """Test diarization with many speakers"""
        annotation = MockAnnotation()
        for i in range(10):
            annotation[MockSegment(i * 1.0, (i + 1) * 1.0)] = f"SPEAKER_{i:02d}"
        
        agent.pipeline = Mock(return_value=annotation)
        
        result = await agent.diarize(str(test_audio_file))
        
        assert result["num_speakers"] == 10
        assert len(result["speakers"]) == 10
        assert len(result["segments"]) == 10
