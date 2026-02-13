"""Unit tests for Audio Processing Services"""
import pytest
import numpy as np
from unittest.mock import Mock, AsyncMock, patch
from app.services.audio_processor import (
    AudioStreamManager,
    TranscriptionPipeline,
    TranscriptAssembler
)


@pytest.mark.unit
class TestAudioStreamManager:
    """Test suite for AudioStreamManager"""
    
    @pytest.fixture
    def manager(self):
        """Create AudioStreamManager instance"""
        return AudioStreamManager(sample_rate=16000, chunk_duration=2.0)
    
    def test_initialization(self, manager):
        """Test manager initializes correctly"""
        assert manager.sample_rate == 16000
        assert manager.chunk_size == 32000  # 16000 * 2.0
        assert len(manager.buffer) == 0
    
    def test_initialization_custom_params(self):
        """Test initialization with custom parameters"""
        manager = AudioStreamManager(sample_rate=44100, chunk_duration=1.0)
        
        assert manager.sample_rate == 44100
        assert manager.chunk_size == 44100
    
    @pytest.mark.asyncio
    async def test_stream_audio_single_chunk(self, manager, mock_websocket):
        """Test streaming single complete audio chunk"""
        # Create test audio data (2 seconds worth)
        audio_data = np.random.randint(-32768, 32767, 32000, dtype=np.int16).tobytes()
        
        mock_websocket.receive_bytes = AsyncMock(side_effect=[audio_data, Exception("Done")])
        
        chunks = []
        try:
            async for chunk in manager.stream_audio(mock_websocket):
                chunks.append(chunk)
        except Exception:
            pass
        
        assert len(chunks) == 1
        assert chunks[0].dtype == np.float32
        assert len(chunks[0]) == 32000
    
    @pytest.mark.asyncio
    async def test_stream_audio_multiple_chunks(self, manager, mock_websocket):
        """Test streaming multiple audio chunks"""
        # Create test audio data (6 seconds = 3 chunks)
        chunk1 = np.random.randint(-32768, 32767, 32000, dtype=np.int16).tobytes()
        chunk2 = np.random.randint(-32768, 32767, 32000, dtype=np.int16).tobytes()
        chunk3 = np.random.randint(-32768, 32767, 32000, dtype=np.int16).tobytes()
        
        mock_websocket.receive_bytes = AsyncMock(
            side_effect=[chunk1, chunk2, chunk3, Exception("Done")]
        )
        
        chunks = []
        try:
            async for chunk in manager.stream_audio(mock_websocket):
                chunks.append(chunk)
        except Exception:
            pass
        
        assert len(chunks) == 3
    
    @pytest.mark.asyncio
    async def test_stream_audio_partial_chunk(self, manager, mock_websocket):
        """Test handling of partial chunks in buffer"""
        # Send 1.5 chunks worth of data
        data1 = np.random.randint(-32768, 32767, 32000, dtype=np.int16).tobytes()
        data2 = np.random.randint(-32768, 32767, 16000, dtype=np.int16).tobytes()
        
        mock_websocket.receive_bytes = AsyncMock(
            side_effect=[data1, data2, Exception("Done")]
        )
        
        chunks = []
        try:
            async for chunk in manager.stream_audio(mock_websocket):
                chunks.append(chunk)
        except Exception:
            pass
        
        # Should only yield 1 complete chunk, buffer the rest
        assert len(chunks) == 1
        assert len(manager.buffer) == 32000  # Remaining half chunk
    
    @pytest.mark.asyncio
    async def test_stream_audio_error_handling(self, manager, mock_websocket):
        """Test error handling during streaming"""
        mock_websocket.receive_bytes = AsyncMock(
            side_effect=Exception("WebSocket error")
        )
        
        with pytest.raises(Exception, match="WebSocket error"):
            async for _ in manager.stream_audio(mock_websocket):
                pass
    
    def test_audio_conversion_to_float(self, manager):
        """Test int16 to float32 conversion"""
        # Max int16 value should convert to ~1.0
        max_int16 = np.array([32767], dtype=np.int16)
        converted = max_int16.astype(np.float32) / 32768.0
        
        assert pytest.approx(converted[0], 0.001) == 1.0
        
        # Min int16 value should convert to ~-1.0
        min_int16 = np.array([-32768], dtype=np.int16)
        converted = min_int16.astype(np.float32) / 32768.0
        
        assert pytest.approx(converted[0], 0.001) == -1.0


@pytest.mark.unit
class TestTranscriptionPipeline:
    """Test suite for TranscriptionPipeline"""
    
    @pytest.fixture
    def mock_agent(self):
        """Create mock transcription agent"""
        agent = Mock()
        agent.transcribe_chunk = AsyncMock()
        return agent
    
    @pytest.fixture
    def pipeline(self, mock_agent):
        """Create TranscriptionPipeline instance"""
        return TranscriptionPipeline(mock_agent)
    
    def test_initialization(self, pipeline, mock_agent):
        """Test pipeline initializes correctly"""
        assert pipeline.agent == mock_agent
    
    @pytest.mark.asyncio
    async def test_process_stream_single_chunk(self, pipeline, mock_agent):
        """Test processing single audio chunk"""
        # Create mock audio stream
        async def audio_generator():
            yield np.random.rand(32000).astype(np.float32)
        
        mock_agent.transcribe_chunk.return_value = {
            "text": "Test transcription",
            "confidence": 0.85,
            "language": "en"
        }
        
        results = []
        async for result in pipeline.process_stream(audio_generator()):
            results.append(result)
        
        assert len(results) == 1
        assert results[0]["text"] == "Test transcription"
        assert results[0]["confidence"] == 0.85
        assert "timestamp" in results[0]
    
    @pytest.mark.asyncio
    async def test_process_stream_multiple_chunks(self, pipeline, mock_agent):
        """Test processing multiple audio chunks"""
        async def audio_generator():
            for i in range(3):
                yield np.random.rand(32000).astype(np.float32)
        
        mock_agent.transcribe_chunk.side_effect = [
            {"text": "First chunk", "confidence": 0.8, "language": "en"},
            {"text": "Second chunk", "confidence": 0.85, "language": "en"},
            {"text": "Third chunk", "confidence": 0.9, "language": "en"}
        ]
        
        results = []
        async for result in pipeline.process_stream(audio_generator()):
            results.append(result)
        
        assert len(results) == 3
        assert results[0]["text"] == "First chunk"
        assert results[2]["text"] == "Third chunk"
    
    @pytest.mark.asyncio
    async def test_process_stream_empty_transcription(self, pipeline, mock_agent):
        """Test handling empty transcription results"""
        async def audio_generator():
            yield np.random.rand(32000).astype(np.float32)
        
        mock_agent.transcribe_chunk.return_value = {
            "text": "",  # Empty transcription
            "confidence": 0.0,
            "language": "en"
        }
        
        results = []
        async for result in pipeline.process_stream(audio_generator()):
            results.append(result)
        
        # Should not yield empty results
        assert len(results) == 0
    
    @pytest.mark.asyncio
    async def test_process_stream_with_errors(self, pipeline, mock_agent):
        """Test handling transcription errors"""
        async def audio_generator():
            yield np.random.rand(32000).astype(np.float32)
        
        mock_agent.transcribe_chunk.return_value = {
            "text": "",
            "error": "Transcription failed",
            "confidence": 0.0
        }
        
        results = []
        async for result in pipeline.process_stream(audio_generator()):
            results.append(result)
        
        assert len(results) == 0


@pytest.mark.unit
class TestTranscriptAssembler:
    """Test suite for TranscriptAssembler"""
    
    def test_merge_transcripts_perfect_alignment(self):
        """Test merging with perfect time alignment"""
        transcription = {
            "segments": [
                {"start": 0.0, "end": 2.5, "text": "Hello", "confidence": 0.9},
                {"start": 2.5, "end": 5.0, "text": "World", "confidence": 0.85}
            ]
        }
        
        diarization = {
            "segments": [
                {"speaker": "SPEAKER_00", "start": 0.0, "end": 2.5, "duration": 2.5},
                {"speaker": "SPEAKER_01", "start": 2.5, "end": 5.0, "duration": 2.5}
            ]
        }
        
        result = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        assert len(result) == 2
        assert result[0]["speaker"] == "SPEAKER_00"
        assert result[0]["text"] == "Hello"
        assert result[1]["speaker"] == "SPEAKER_01"
        assert result[1]["text"] == "World"
    
    def test_merge_transcripts_overlapping_segments(self):
        """Test merging with overlapping time segments"""
        transcription = {
            "segments": [
                {"start": 0.0, "end": 3.0, "text": "Overlapping text", "confidence": 0.8}
            ]
        }
        
        diarization = {
            "segments": [
                {"speaker": "SPEAKER_00", "start": 0.0, "end": 1.5, "duration": 1.5},
                {"speaker": "SPEAKER_01", "start": 1.5, "end": 4.0, "duration": 2.5}
            ]
        }
        
        result = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        # Should assign to speaker with maximum overlap
        assert len(result) == 1
        # First half overlaps more with SPEAKER_00
        assert result[0]["speaker"] == "SPEAKER_00"
    
    def test_merge_transcripts_no_diarization(self):
        """Test merging when diarization is unavailable"""
        transcription = {
            "segments": [
                {"start": 0.0, "end": 2.5, "text": "Hello", "confidence": 0.9},
                {"start": 2.5, "end": 5.0, "text": "World", "confidence": 0.85}
            ]
        }
        
        diarization = {"segments": []}
        
        result = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        assert len(result) == 2
        assert all(seg["speaker"] == "Unknown" for seg in result)
    
    def test_merge_transcripts_empty(self):
        """Test merging empty transcripts"""
        result = TranscriptAssembler.merge_transcripts(
            {"segments": []},
            {"segments": []}
        )
        
        assert result == []
    
    def test_calculate_overlap_full(self):
        """Test full overlap calculation"""
        overlap = TranscriptAssembler._calculate_overlap(0.0, 2.0, 0.0, 2.0)
        
        assert overlap == 1.0
    
    def test_calculate_overlap_partial(self):
        """Test partial overlap calculation"""
        # 50% overlap
        overlap = TranscriptAssembler._calculate_overlap(0.0, 2.0, 1.0, 3.0)
        
        assert overlap == 0.5
    
    def test_calculate_overlap_none(self):
        """Test no overlap"""
        overlap = TranscriptAssembler._calculate_overlap(0.0, 1.0, 2.0, 3.0)
        
        assert overlap == 0.0
    
    def test_calculate_overlap_contained(self):
        """Test when one segment contains another"""
        # Small segment fully contained in larger one
        overlap = TranscriptAssembler._calculate_overlap(1.0, 2.0, 0.0, 3.0)
        
        assert overlap == 1.0
    
    def test_merge_multiple_speakers_rapid_switching(self):
        """Test rapid speaker switching"""
        transcription = {
            "segments": [
                {"start": 0.0, "end": 1.0, "text": "A", "confidence": 0.9},
                {"start": 1.0, "end": 2.0, "text": "B", "confidence": 0.9},
                {"start": 2.0, "end": 3.0, "text": "C", "confidence": 0.9}
            ]
        }
        
        diarization = {
            "segments": [
                {"speaker": "SPEAKER_00", "start": 0.0, "end": 1.0, "duration": 1.0},
                {"speaker": "SPEAKER_01", "start": 1.0, "end": 2.0, "duration": 1.0},
                {"speaker": "SPEAKER_02", "start": 2.0, "end": 3.0, "duration": 1.0}
            ]
        }
        
        result = TranscriptAssembler.merge_transcripts(transcription, diarization)
        
        assert len(result) == 3
        assert result[0]["speaker"] == "SPEAKER_00"
        assert result[1]["speaker"] == "SPEAKER_01"
        assert result[2]["speaker"] == "SPEAKER_02"
