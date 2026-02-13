"""Unit tests for ContextRetrievalAgent"""
import pytest
from unittest.mock import Mock, AsyncMock
import numpy as np
from app.agents.context_retrieval_agent import ContextRetrievalAgent


@pytest.mark.unit
class TestContextRetrievalAgent:
    """Test suite for ContextRetrievalAgent"""
    
    @pytest.fixture
    def mock_vector_store(self, mock_qdrant_client, mock_sentence_transformer):
        """Create mock vector store"""
        vector_store = Mock()
        vector_store.encoder = mock_sentence_transformer
        vector_store.client = mock_qdrant_client
        vector_store.collection_name = "test_meetings"
        return vector_store
    
    @pytest.fixture
    def agent(self, mock_vector_store):
        """Create ContextRetrievalAgent with mocked dependencies"""
        return ContextRetrievalAgent(vector_store=mock_vector_store)
    
    def test_agent_initialization(self, mock_vector_store):
        """Test agent initializes correctly"""
        agent = ContextRetrievalAgent(vector_store=mock_vector_store)
        assert agent.vector_store == mock_vector_store
    
    @pytest.mark.asyncio
    async def test_retrieve_context_success(self, agent, mock_vector_store):
        """Test successful context retrieval"""
        # Setup mock search results
        mock_result = Mock()
        mock_result.payload = {
            "text": "We discussed the authentication module",
            "speaker": "SPEAKER_00",
            "meeting_id": "meeting-123",
            "timestamp": 45.0,
            "metadata": {"date": "2024-01-15"}
        }
        mock_result.score = 0.85
        
        mock_vector_store.client.search.return_value = [mock_result]
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(
            query="authentication module",
            limit=5
        )
        
        assert len(results) == 1
        assert results[0]["text"] == "We discussed the authentication module"
        assert results[0]["speaker"] == "SPEAKER_00"
        assert results[0]["meeting_id"] == "meeting-123"
        assert results[0]["score"] == 0.85
        assert results[0]["timestamp"] == 45.0
        assert results[0]["metadata"]["date"] == "2024-01-15"
    
    @pytest.mark.asyncio
    async def test_retrieve_context_multiple_results(self, agent, mock_vector_store):
        """Test retrieving multiple context segments"""
        mock_results = []
        for i in range(3):
            result = Mock()
            result.payload = {
                "text": f"Segment {i}",
                "speaker": f"SPEAKER_0{i % 2}",
                "meeting_id": f"meeting-{i}",
                "timestamp": i * 10.0,
                "metadata": {}
            }
            result.score = 0.9 - (i * 0.1)
            mock_results.append(result)
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(query="test", limit=3)
        
        assert len(results) == 3
        assert results[0]["score"] == 0.9
        assert results[1]["score"] == 0.8
        assert results[2]["score"] == 0.7
    
    @pytest.mark.asyncio
    async def test_retrieve_context_with_limit(self, agent, mock_vector_store):
        """Test limit parameter works correctly"""
        # Return more results than limit
        mock_results = [Mock() for _ in range(10)]
        for i, result in enumerate(mock_results):
            result.payload = {
                "text": f"Segment {i}",
                "speaker": "SPEAKER_00",
                "meeting_id": f"meeting-{i}",
                "timestamp": 0,
                "metadata": {}
            }
            result.score = 0.9
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(query="test", limit=5)
        
        # Should only return 5 results
        assert len(results) == 5
    
    @pytest.mark.asyncio
    async def test_retrieve_context_with_score_threshold(self, agent, mock_vector_store):
        """Test score threshold filtering"""
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        await agent.retrieve_context(
            query="test",
            score_threshold=0.8
        )
        
        call_kwargs = mock_vector_store.client.search.call_args[1]
        assert call_kwargs["score_threshold"] == 0.8
    
    @pytest.mark.asyncio
    async def test_retrieve_context_excludes_meeting(self, agent, mock_vector_store):
        """Test excluding specific meeting from results"""
        mock_results = []
        for i in range(5):
            result = Mock()
            result.payload = {
                "text": f"Segment {i}",
                "speaker": "SPEAKER_00",
                "meeting_id": "meeting-1" if i < 3 else "meeting-2",
                "timestamp": 0,
                "metadata": {}
            }
            result.score = 0.9
            mock_results.append(result)
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        # Exclude meeting-1
        results = await agent.retrieve_context(
            query="test",
            limit=5,
            meeting_id_exclude="meeting-1"
        )
        
        # Should only have results from meeting-2
        assert all(r["meeting_id"] == "meeting-2" for r in results)
        assert len(results) == 2
    
    @pytest.mark.asyncio
    async def test_retrieve_context_handles_missing_fields(self, agent, mock_vector_store):
        """Test handling of optional payload fields"""
        mock_result = Mock()
        mock_result.payload = {
            "text": "Test segment",
            "speaker": "SPEAKER_00",
            "meeting_id": "meeting-123"
            # Missing timestamp and metadata
        }
        mock_result.score = 0.9
        
        mock_vector_store.client.search.return_value = [mock_result]
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(query="test")
        
        assert len(results) == 1
        assert results[0]["timestamp"] == 0  # Default value
        assert results[0]["metadata"] == {}  # Default value
    
    @pytest.mark.asyncio
    async def test_retrieve_context_error_handling(self, agent, mock_vector_store):
        """Test error handling during retrieval"""
        mock_vector_store.client.search.side_effect = Exception("Search failed")
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(query="test")
        
        # Should return empty list on error
        assert results == []
    
    @pytest.mark.asyncio
    async def test_retrieve_context_empty_results(self, agent, mock_vector_store):
        """Test handling of empty search results"""
        mock_vector_store.client.search.return_value = []
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_context(query="nonexistent query")
        
        assert results == []
    
    @pytest.mark.asyncio
    async def test_retrieve_related_meetings_success(self, agent, mock_vector_store):
        """Test retrieving related meetings"""
        # Create mock results from different meetings
        mock_results = []
        for i in range(6):
            result = Mock()
            result.payload = {
                "text": f"Segment {i}",
                "speaker": "SPEAKER_00",
                "meeting_id": f"meeting-{i % 3}",  # 3 different meetings
                "timestamp": 0,
                "metadata": {"title": f"Meeting {i % 3}"}
            }
            result.score = 0.9 - (i * 0.05)
            mock_results.append(result)
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_related_meetings(
            query="project discussion",
            limit=3
        )
        
        # Should return 3 unique meetings
        assert len(results) == 3
        meeting_ids = [r["meeting_id"] for r in results]
        assert len(set(meeting_ids)) == 3  # All unique
    
    @pytest.mark.asyncio
    async def test_retrieve_related_meetings_deduplication(self, agent, mock_vector_store):
        """Test meetings are deduplicated by ID"""
        # Multiple segments from same meeting
        mock_results = []
        for i in range(10):
            result = Mock()
            result.payload = {
                "text": f"Segment {i}",
                "speaker": "SPEAKER_00",
                "meeting_id": "meeting-1",  # All same meeting
                "timestamp": i * 10.0,
                "metadata": {"title": "Important Meeting"}
            }
            result.score = 0.9
            mock_results.append(result)
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_related_meetings(query="test", limit=5)
        
        # Should only return 1 unique meeting
        assert len(results) == 1
        assert results[0]["meeting_id"] == "meeting-1"
    
    @pytest.mark.asyncio
    async def test_retrieve_related_meetings_aggregates_segments(self, agent, mock_vector_store):
        """Test meeting segments are aggregated"""
        mock_results = []
        for i in range(4):
            result = Mock()
            result.payload = {
                "text": f"Segment {i}",
                "speaker": f"SPEAKER_0{i % 2}",
                "meeting_id": "meeting-1",
                "timestamp": i * 10.0,
                "metadata": {"title": "Meeting 1"}
            }
            result.score = 0.9
            mock_results.append(result)
        
        mock_vector_store.client.search.return_value = mock_results
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        results = await agent.retrieve_related_meetings(query="test")
        
        assert len(results) == 1
        assert results[0]["num_relevant_segments"] == 4
        assert len(results[0]["top_segments"]) == 3  # Only top 3 returned
    
    @pytest.mark.asyncio
    async def test_retrieve_related_meetings_error_handling(self, agent, mock_vector_store):
        """Test error handling in related meetings retrieval"""
        mock_vector_store.encoder.encode.side_effect = Exception("Encoding failed")
        
        results = await agent.retrieve_related_meetings(query="test")
        
        assert results == []
    
    @pytest.mark.asyncio
    async def test_retrieve_context_query_encoding(self, agent, mock_vector_store):
        """Test query is properly encoded"""
        mock_vector_store.client.search.return_value = []
        mock_vector_store.encoder.encode.return_value = np.random.rand(384)
        
        query = "authentication module discussion"
        await agent.retrieve_context(query=query)
        
        # Verify encoder was called with the query
        mock_vector_store.encoder.encode.assert_called_once_with(query)
    
    @pytest.mark.asyncio
    async def test_retrieve_context_vector_passed_to_search(self, agent, mock_vector_store):
        """Test encoded vector is passed to search"""
        test_vector = np.array([0.1, 0.2, 0.3])
        mock_vector_store.encoder.encode.return_value = test_vector
        mock_vector_store.client.search.return_value = []
        
        await agent.retrieve_context(query="test")
        
        call_kwargs = mock_vector_store.client.search.call_args[1]
        assert "query_vector" in call_kwargs
        # Vector should be converted to list
        assert call_kwargs["query_vector"] == test_vector.tolist()
