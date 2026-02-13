"""Pytest configuration and shared fixtures"""
import pytest
import numpy as np
from typing import Dict, List
from unittest.mock import Mock, AsyncMock
import os
from pathlib import Path

# Set environment variables at module import time (before any app imports)
os.environ["OPENAI_API_KEY"] = "test-key-123"
os.environ["HUGGINGFACE_TOKEN"] = "test-hf-token"
os.environ["POSTGRES_USER"] = "test_user"
os.environ["POSTGRES_PASSWORD"] = "test_pass"
os.environ["POSTGRES_DB"] = "test_db"
os.environ["POSTGRES_HOST"] = "localhost"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"
os.environ["QDRANT_URL"] = "http://localhost:6333"


@pytest.fixture
def sample_audio_chunk() -> np.ndarray:
    """Generate sample audio data for testing"""
    sample_rate = 16000
    duration = 2.0  # seconds
    samples = int(sample_rate * duration)
    
    # Generate simple sine wave
    frequency = 440.0  # A4 note
    t = np.linspace(0, duration, samples, endpoint=False)
    audio = np.sin(2 * np.pi * frequency * t).astype(np.float32)
    
    return audio


@pytest.fixture
def sample_whisper_result() -> Dict:
    """Sample Whisper transcription result"""
    return {
        "text": "This is a test meeting transcript.",
        "language": "en",
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 2.5,
                "text": "This is a test meeting transcript.",
                "avg_logprob": -0.2,
                "confidence": 0.8
            }
        ]
    }


@pytest.fixture
def sample_diarization_result() -> Dict:
    """Sample diarization result"""
    return {
        "speakers": ["SPEAKER_00", "SPEAKER_01"],
        "num_speakers": 2,
        "segments": [
            {
                "speaker": "SPEAKER_00",
                "start": 0.0,
                "end": 2.5,
                "duration": 2.5
            },
            {
                "speaker": "SPEAKER_01",
                "start": 2.5,
                "end": 5.0,
                "duration": 2.5
            }
        ]
    }


@pytest.fixture
def sample_transcript() -> List[Dict]:
    """Sample attributed transcript"""
    return [
        {
            "speaker": "SPEAKER_00",
            "start": 0.0,
            "end": 2.5,
            "text": "Hello everyone, welcome to the meeting.",
            "confidence": 0.85
        },
        {
            "speaker": "SPEAKER_01",
            "start": 2.5,
            "end": 5.0,
            "text": "Thanks for joining. Let's discuss the project status.",
            "confidence": 0.82
        },
        {
            "speaker": "SPEAKER_00",
            "start": 5.0,
            "end": 8.0,
            "text": "We need to complete the authentication module by Friday.",
            "confidence": 0.88
        }
    ]


@pytest.fixture
def sample_meeting_metadata() -> Dict:
    """Sample meeting metadata"""
    return {
        "meeting_id": "test-meeting-123",
        "date": "2024-01-15",
        "title": "Project Status Meeting",
        "participants": ["Alice", "Bob"],
        "duration": 300.0
    }


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for LLM testing"""
    mock = AsyncMock()
    mock.ainvoke = AsyncMock(return_value=Mock(
        content="This is a test summary of the meeting."
    ))
    return mock


@pytest.fixture
def mock_whisper_model():
    """Mock Whisper model"""
    mock = Mock()
    mock.transcribe = Mock(return_value={
        "text": "Test transcription",
        "language": "en",
        "segments": [
            {
                "start": 0.0,
                "end": 2.0,
                "text": "Test transcription",
                "avg_logprob": -0.3
            }
        ]
    })
    return mock


@pytest.fixture
def mock_pyannote_pipeline():
    """Mock Pyannote diarization pipeline"""
    from unittest.mock import MagicMock
    
    mock = MagicMock()
    
    # Create a mock annotation that properly implements itertracks
    class MockAnnotation:
        def __init__(self):
            self.tracks = []
        
        def __setitem__(self, segment, speaker):
            self.tracks.append((segment, speaker))
        
        def itertracks(self, yield_label=False):
            """Mock itertracks to return (segment, track_id, speaker)"""
            for segment, speaker in self.tracks:
                yield (segment, None, speaker)
    
    # Create mock segments
    class MockSegment:
        def __init__(self, start, end):
            self.start = start
            self.end = end
    
    # Create default annotation with test data
    annotation = MockAnnotation()
    annotation[MockSegment(0, 2.5)] = "SPEAKER_00"
    annotation[MockSegment(2.5, 5.0)] = "SPEAKER_01"
    
    mock.return_value = annotation
    return mock


@pytest.fixture
def mock_qdrant_client():
    """Mock Qdrant client"""
    mock = Mock()
    mock.get_collection = Mock()
    mock.create_collection = Mock()
    mock.upsert = Mock()
    mock.delete = Mock()
    mock.search = Mock(return_value=[])
    return mock


@pytest.fixture
def mock_sentence_transformer():
    """Mock SentenceTransformer for embeddings"""
    mock = Mock()
    mock.encode = Mock(return_value=np.random.rand(384))
    mock.get_sentence_embedding_dimension = Mock(return_value=384)
    return mock


@pytest.fixture
def test_audio_file(tmp_path) -> Path:
    """Create temporary test audio file"""
    import soundfile as sf
    
    audio_path = tmp_path / "test_audio.wav"
    
    # Generate 5 seconds of test audio
    sample_rate = 16000
    duration = 5.0
    samples = int(sample_rate * duration)
    
    # Simple sine wave
    t = np.linspace(0, duration, samples, endpoint=False)
    audio = np.sin(2 * np.pi * 440 * t).astype(np.float32)
    
    sf.write(audio_path, audio, sample_rate)
    
    return audio_path


@pytest.fixture
async def mock_websocket():
    """Mock WebSocket for streaming tests"""
    mock = AsyncMock()
    mock.receive_bytes = AsyncMock()
    mock.send_json = AsyncMock()
    mock.send_text = AsyncMock()
    return mock


# Skip markers for tests requiring external resources
def pytest_configure(config):
    """Configure custom skip markers"""
    config.addinivalue_line(
        "markers", "skip_if_no_gpu: skip test if GPU not available"
    )
    config.addinivalue_line(
        "markers", "skip_if_no_openai: skip test if OpenAI API key not set"
    )


def pytest_collection_modifyitems(config, items):
    """Auto-skip tests based on environment"""
    import torch
    
    skip_gpu = pytest.mark.skip(reason="GPU not available")
    skip_openai = pytest.mark.skip(reason="OpenAI API key not set")
    
    for item in items:
        # Skip GPU tests if CUDA not available
        if "requires_gpu" in item.keywords and not torch.cuda.is_available():
            item.add_marker(skip_gpu)
        
        # Skip OpenAI tests if API key not set properly
        if "requires_openai" in item.keywords:
            api_key = os.getenv("OPENAI_API_KEY", "")
            if not api_key or api_key.startswith("test-"):
                item.add_marker(skip_openai)
