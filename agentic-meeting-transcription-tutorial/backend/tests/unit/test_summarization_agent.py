"""Unit tests for SummarizationAgent"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.agents.summarization_agent import SummarizationAgent


@pytest.mark.unit
class TestSummarizationAgent:
    """Test suite for SummarizationAgent"""
    
    @pytest.fixture
    def agent(self, mock_openai_client):
        """Create SummarizationAgent with mocked LLM"""
        with patch('app.agents.summarization_agent.ChatOpenAI', return_value=mock_openai_client):
            agent = SummarizationAgent()
        return agent
    
    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent.llm is not None
    
    def test_agent_initialization_custom_model(self):
        """Test agent with custom model parameters"""
        with patch('app.agents.summarization_agent.ChatOpenAI') as mock_llm:
            agent = SummarizationAgent(
                model_name="gpt-4",
                temperature=0.5
            )
            mock_llm.assert_called_once()
            call_kwargs = mock_llm.call_args[1]
            assert call_kwargs["model_name"] == "gpt-4"
            assert call_kwargs["temperature"] == 0.5
    
    @pytest.mark.asyncio
    async def test_summarize_brief(self, agent, sample_transcript):
        """Test brief summary generation"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Brief summary of the meeting covering authentication module deadline."
        ))
        
        result = await agent.summarize(
            sample_transcript,
            detail_level="brief"
        )
        
        assert "brief" in result
        assert len(result) == 1
        assert "authentication" in result["brief"].lower()
    
    @pytest.mark.asyncio
    async def test_summarize_medium(self, agent, sample_transcript):
        """Test medium detail summary generation"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Medium summary with key points about authentication module and Friday deadline."
        ))
        
        result = await agent.summarize(
            sample_transcript,
            detail_level="medium"
        )
        
        assert "medium" in result
        assert len(result) == 1
    
    @pytest.mark.asyncio
    async def test_summarize_detailed(self, agent, sample_transcript):
        """Test detailed summary generation"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Detailed comprehensive summary with complete discussion points."
        ))
        
        result = await agent.summarize(
            sample_transcript,
            detail_level="detailed"
        )
        
        assert "detailed" in result
        assert len(result) == 1
    
    @pytest.mark.asyncio
    async def test_summarize_all_levels(self, agent, sample_transcript):
        """Test generating all summary levels"""
        agent.llm.ainvoke = AsyncMock(side_effect=[
            Mock(content="Brief summary"),
            Mock(content="Medium summary"),
            Mock(content="Detailed summary")
        ])
        
        result = await agent.summarize(
            sample_transcript,
            detail_level="all"
        )
        
        assert "brief" in result
        assert "medium" in result
        assert "detailed" in result
        assert len(result) == 3
    
    @pytest.mark.asyncio
    async def test_summarize_with_context(self, agent, sample_transcript):
        """Test summarization with historical context"""
        context = [
            {
                "meeting_id": "prev-meeting-1",
                "speaker": "SPEAKER_00",
                "text": "Previous discussion about authentication",
                "score": 0.85
            }
        ]
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Summary incorporating historical context"
        ))
        
        result = await agent.summarize(
            sample_transcript,
            context=context,
            detail_level="medium"
        )
        
        # Verify context was included in prompt
        call_args = agent.llm.ainvoke.call_args[0][0]
        prompt_content = call_args[0].content
        assert "Historical context" in prompt_content
        assert "prev-meeting-1" in prompt_content
    
    @pytest.mark.asyncio
    async def test_summarize_error_handling(self, agent, sample_transcript):
        """Test error handling during summarization"""
        agent.llm.ainvoke = AsyncMock(side_effect=Exception("API Error"))
        
        result = await agent.summarize(
            sample_transcript,
            detail_level="brief"
        )
        
        assert "brief" in result
        assert "Error" in result["brief"]
    
    def test_format_transcript(self, agent, sample_transcript):
        """Test transcript formatting for LLM"""
        formatted = agent._format_transcript(sample_transcript)
        
        assert "[0.0s] SPEAKER_00:" in formatted
        assert "[2.5s] SPEAKER_01:" in formatted
        assert "Hello everyone" in formatted
        assert "authentication module" in formatted
    
    def test_format_transcript_empty(self, agent):
        """Test formatting empty transcript"""
        formatted = agent._format_transcript([])
        
        assert formatted == ""
    
    def test_format_transcript_missing_fields(self, agent):
        """Test formatting transcript with missing fields"""
        incomplete_transcript = [
            {"text": "Missing speaker and timestamp"},
            {"speaker": "SPEAKER_00"},  # Missing text
            {}  # Empty segment
        ]
        
        formatted = agent._format_transcript(incomplete_transcript)
        
        # Should handle gracefully
        assert "Unknown:" in formatted
        assert "Missing speaker" in formatted
    
    def test_format_context_with_data(self, agent):
        """Test context formatting"""
        context = [
            {
                "meeting_id": "meeting-1",
                "speaker": "Alice",
                "text": "Previous discussion point",
                "score": 0.92
            },
            {
                "meeting_id": "meeting-2",
                "speaker": "Bob",
                "text": "Related topic",
                "score": 0.78
            }
        ]
        
        formatted = agent._format_context(context)
        
        assert "Historical context" in formatted
        assert "meeting-1" in formatted
        assert "Relevance: 0.92" in formatted
        assert "Previous discussion point" in formatted
    
    def test_format_context_empty(self, agent):
        """Test formatting with no context"""
        formatted = agent._format_context([])
        
        assert "No historical context" in formatted
    
    def test_format_context_none(self, agent):
        """Test formatting with None context"""
        formatted = agent._format_context(None)
        
        assert "No historical context" in formatted
    
    @pytest.mark.asyncio
    async def test_generate_brief_summary_directly(self, agent):
        """Test brief summary generation method"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Test brief summary"
        ))
        
        result = await agent._generate_brief_summary(
            "Test transcript",
            "Test context"
        )
        
        assert result == "Test brief summary"
    
    @pytest.mark.asyncio
    async def test_generate_medium_summary_directly(self, agent):
        """Test medium summary generation method"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Test medium summary"
        ))
        
        result = await agent._generate_medium_summary(
            "Test transcript",
            "Test context"
        )
        
        assert result == "Test medium summary"
    
    @pytest.mark.asyncio
    async def test_generate_detailed_summary_directly(self, agent):
        """Test detailed summary generation method"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Test detailed summary"
        ))
        
        result = await agent._generate_detailed_summary(
            "Test transcript",
            "Test context"
        )
        
        assert result == "Test detailed summary"
    
    @pytest.mark.asyncio
    async def test_summarize_long_transcript(self, agent):
        """Test summarization with very long transcript"""
        long_transcript = [
            {
                "speaker": f"SPEAKER_{i % 3}",
                "start": i * 2.0,
                "end": (i + 1) * 2.0,
                "text": f"This is segment {i} with some content.",
                "confidence": 0.85
            }
            for i in range(100)
        ]
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(
            content="Summary of long transcript"
        ))
        
        result = await agent.summarize(
            long_transcript,
            detail_level="brief"
        )
        
        assert "brief" in result
        # Should handle large inputs
        call_args = agent.llm.ainvoke.call_args[0][0]
        prompt = call_args[0].content
        assert "segment 0" in prompt
        assert "segment 99" in prompt
