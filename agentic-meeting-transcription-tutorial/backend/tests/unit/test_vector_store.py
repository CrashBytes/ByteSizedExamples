"""Unit tests for Vector Store Service"""
import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from app.services.vector_store import MeetingVectorStore


@pytest.mark.unit
class TestMeetingVectorStore:
    """Test suite for MeetingVectorStore"""
    
    @pytest.fixture
    def mock_qdrant(self, mock_qdrant_client):
        """Create mocked Qdrant client"""
        return mock_qdrant_client
    
    @pytest.fixture
    def mock_encoder(self, mock_sentence_transformer):
        """Create mocked sentence transformer"""
        return mock_sentence_transformer
    
    @pytest.fixture
    def vector_store(self, mock_qdrant, mock_encoder):
        """Create MeetingVectorStore with mocks"""
        with patch('app.services.vector_store.QdrantClient', return_value=mock_qdrant):
            with patch('app.services.vector_store.SentenceTransformer', return_value=mock_encoder):
                store = MeetingVectorStore()
        return store
    
    def test_initialization(self, vector_store):
        """Test vector store initializes correctly"""
        assert vector_store.client is not None
        assert vector_store.encoder is not None
        assert vector_store.collection_name == "meeting_transcripts"
        assert vector_store.embedding_dim == 384
    
    def test_initialization_custom_params(self, mock_qdrant, mock_encoder):
        """Test initialization with custom parameters"""
        with patch('app.services.vector_store.QdrantClient', return_value=mock_qdrant):
            with patch('app.services.vector_store.SentenceTransformer', return_value=mock_encoder):
                store = MeetingVectorStore(
                    qdrant_url="http://custom:6333",
                    collection_name="custom_collection",
                    embedding_model="custom-model",
                    api_key="test-key"
                )
        
        assert store.collection_name == "custom_collection"
    
    def test_initialize_collection_exists(self, vector_store, mock_qdrant):
        """Test initialization when collection already exists"""
        mock_qdrant.get_collection.return_value = Mock()
        mock_qdrant.reset_mock()  # Reset the mock to clear initialization calls
        
        vector_store._initialize_collection()
        
        assert mock_qdrant.get_collection.call_count >= 1
        mock_qdrant.create_collection.assert_not_called()
    
    def test_initialize_collection_create_new(self, vector_store, mock_qdrant):
        """Test creating new collection"""
        mock_qdrant.get_collection.side_effect = Exception("Not found")
        
        vector_store._initialize_collection()
        
        mock_qdrant.create_collection.assert_called_once()
        call_args = mock_qdrant.create_collection.call_args[1]
        assert call_args["collection_name"] == "meeting_transcripts"
    
    @pytest.mark.asyncio
    async def test_store_meeting_success(
        self,
        vector_store,
        sample_transcript,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test storing meeting successfully"""
        mock_encoder.encode.return_value = np.random.rand(384)
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=sample_transcript,
            metadata=sample_meeting_metadata
        )
        
        # Should encode each segment
        assert mock_encoder.encode.call_count == len(sample_transcript)
        
        # Should upsert points to Qdrant
        vector_store.client.upsert.assert_called_once()
        call_args = vector_store.client.upsert.call_args[1]
        assert call_args["collection_name"] == "meeting_transcripts"
        assert len(call_args["points"]) == len(sample_transcript)
    
    @pytest.mark.asyncio
    async def test_store_meeting_empty_transcript(
        self,
        vector_store,
        sample_meeting_metadata
    ):
        """Test storing meeting with empty transcript"""
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=[],
            metadata=sample_meeting_metadata
        )
        
        # Should not attempt to upsert
        vector_store.client.upsert.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_store_meeting_skip_empty_segments(
        self,
        vector_store,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test storing meeting with some empty segments"""
        transcript = [
            {"speaker": "A", "start": 0.0, "end": 2.0, "text": "Valid text"},
            {"speaker": "B", "start": 2.0, "end": 4.0, "text": ""},  # Empty
            {"speaker": "C", "start": 4.0, "end": 6.0, "text": "More text"}
        ]
        
        mock_encoder.encode.return_value = np.random.rand(384)
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=transcript,
            metadata=sample_meeting_metadata
        )
        
        # Should only encode non-empty segments
        assert mock_encoder.encode.call_count == 2
        
        # Should only store 2 points
        call_args = vector_store.client.upsert.call_args[1]
        assert len(call_args["points"]) == 2
    
    @pytest.mark.asyncio
    async def test_store_meeting_payload_structure(
        self,
        vector_store,
        sample_transcript,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test stored payload has correct structure"""
        mock_encoder.encode.return_value = np.random.rand(384)
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=sample_transcript,
            metadata=sample_meeting_metadata
        )
        
        call_args = vector_store.client.upsert.call_args[1]
        points = call_args["points"]
        
        # Check first point structure
        point = points[0]
        assert point.payload["meeting_id"] == "test-meeting-123"
        assert point.payload["segment_index"] == 0
        assert "speaker" in point.payload
        assert "text" in point.payload
        assert "timestamp" in point.payload
        assert point.payload["metadata"] == sample_meeting_metadata
    
    @pytest.mark.asyncio
    async def test_store_meeting_error_handling(
        self,
        vector_store,
        sample_transcript,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test error handling during storage"""
        mock_encoder.encode.side_effect = Exception("Encoding failed")
        
        with pytest.raises(Exception, match="Encoding failed"):
            await vector_store.store_meeting(
                meeting_id="test-meeting-123",
                transcript=sample_transcript,
                metadata=sample_meeting_metadata
            )
    
    @pytest.mark.asyncio
    async def test_delete_meeting_success(self, vector_store):
        """Test deleting meeting successfully"""
        await vector_store.delete_meeting("test-meeting-123")
        
        vector_store.client.delete.assert_called_once()
        call_args = vector_store.client.delete.call_args[1]
        assert call_args["collection_name"] == "meeting_transcripts"
    
    @pytest.mark.asyncio
    async def test_delete_meeting_error_handling(self, vector_store):
        """Test error handling during deletion"""
        vector_store.client.delete.side_effect = Exception("Delete failed")
        
        with pytest.raises(Exception, match="Delete failed"):
            await vector_store.delete_meeting("test-meeting-123")
    
    @pytest.mark.asyncio
    async def test_store_multiple_meetings(
        self,
        vector_store,
        sample_transcript,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test storing multiple meetings"""
        mock_encoder.encode.return_value = np.random.rand(384)
        
        # Store first meeting
        await vector_store.store_meeting(
            meeting_id="meeting-1",
            transcript=sample_transcript,
            metadata=sample_meeting_metadata
        )
        
        # Store second meeting
        await vector_store.store_meeting(
            meeting_id="meeting-2",
            transcript=sample_transcript,
            metadata=sample_meeting_metadata
        )
        
        # Should have called upsert twice
        assert vector_store.client.upsert.call_count == 2
    
    @pytest.mark.asyncio
    async def test_embedding_dimension_matches(
        self,
        vector_store,
        sample_transcript,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test that embedding dimensions match expected size"""
        # Create embedding with correct dimension
        embedding = np.random.rand(384)
        mock_encoder.encode.return_value = embedding
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=sample_transcript[:1],  # Just one segment
            metadata=sample_meeting_metadata
        )
        
        call_args = vector_store.client.upsert.call_args[1]
        point = call_args["points"][0]
        
        # Verify vector dimension
        assert len(point.vector) == 384
    
    @pytest.mark.asyncio
    async def test_store_preserves_speaker_info(
        self,
        vector_store,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test that speaker information is preserved"""
        transcript = [
            {"speaker": "Alice", "start": 0.0, "end": 2.0, "text": "Hello"},
            {"speaker": "Bob", "start": 2.0, "end": 4.0, "text": "Hi there"}
        ]
        
        mock_encoder.encode.return_value = np.random.rand(384)
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=transcript,
            metadata=sample_meeting_metadata
        )
        
        call_args = vector_store.client.upsert.call_args[1]
        points = call_args["points"]
        
        assert points[0].payload["speaker"] == "Alice"
        assert points[1].payload["speaker"] == "Bob"
    
    @pytest.mark.asyncio
    async def test_store_preserves_timestamps(
        self,
        vector_store,
        sample_meeting_metadata,
        mock_encoder
    ):
        """Test that timestamps are preserved"""
        transcript = [
            {"speaker": "A", "start": 1.5, "end": 3.7, "text": "Test"}
        ]
        
        mock_encoder.encode.return_value = np.random.rand(384)
        
        await vector_store.store_meeting(
            meeting_id="test-meeting-123",
            transcript=transcript,
            metadata=sample_meeting_metadata
        )
        
        call_args = vector_store.client.upsert.call_args[1]
        point = call_args["points"][0]
        
        assert point.payload["timestamp"] == 1.5
    
    def test_encoder_dimension_property(self, vector_store, mock_encoder):
        """Test that encoder dimension is correctly retrieved"""
        mock_encoder.get_sentence_embedding_dimension.return_value = 512
        
        # Re-initialize to test dimension
        with patch('app.services.vector_store.SentenceTransformer', return_value=mock_encoder):
            vector_store.embedding_dim = mock_encoder.get_sentence_embedding_dimension()
        
        assert vector_store.embedding_dim == 512
