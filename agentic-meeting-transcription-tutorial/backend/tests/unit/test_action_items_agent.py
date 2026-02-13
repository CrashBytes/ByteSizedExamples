"""Unit tests for ActionItemsAgent"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.agents.action_items_agent import ActionItemsAgent, ActionItem, ActionItemsList


@pytest.mark.unit
class TestActionItemsAgent:
    """Test suite for ActionItemsAgent"""
    
    @pytest.fixture
    def agent(self, mock_openai_client):
        """Create ActionItemsAgent with mocked LLM"""
        with patch('app.agents.action_items_agent.ChatOpenAI', return_value=mock_openai_client):
            agent = ActionItemsAgent()
        return agent
    
    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent.llm is not None
        assert agent.parser is not None
    
    def test_agent_initialization_custom_params(self):
        """Test agent with custom parameters"""
        with patch('app.agents.action_items_agent.ChatOpenAI') as mock_llm:
            agent = ActionItemsAgent(
                model_name="gpt-4",
                temperature=0.1
            )
            call_kwargs = mock_llm.call_args[1]
            assert call_kwargs["model_name"] == "gpt-4"
            assert call_kwargs["temperature"] == 0.1
    
    @pytest.mark.asyncio
    async def test_extract_action_items_success(self, agent, sample_transcript):
        """Test successful action item extraction"""
        # Mock structured output
        mock_response = Mock(
            content="""{
                "items": [
                    {
                        "description": "Complete authentication module",
                        "assignee": "SPEAKER_00",
                        "due_date": "Friday",
                        "priority": "high",
                        "context": "Discussed in project status meeting"
                    }
                ]
            }"""
        )
        
        agent.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        # Mock parser to return structured data
        agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Complete authentication module",
                    assignee="SPEAKER_00",
                    due_date="Friday",
                    priority="high",
                    context="Discussed in project status meeting"
                )
            ]
        ))
        
        result = await agent.extract_action_items(sample_transcript)
        
        assert len(result) == 1
        assert result[0].description == "Complete authentication module"
        assert result[0].priority == "high"
        assert result[0].due_date == "Friday"
    
    @pytest.mark.asyncio
    async def test_extract_action_items_multiple(self, agent):
        """Test extracting multiple action items"""
        transcript = [
            {
                "speaker": "Alice",
                "start": 0.0,
                "end": 3.0,
                "text": "Bob, can you review the PR by tomorrow?",
                "confidence": 0.9
            },
            {
                "speaker": "Bob",
                "start": 3.0,
                "end": 6.0,
                "text": "Sure, and I'll also update the documentation.",
                "confidence": 0.85
            }
        ]
        
        agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Review PR",
                    assignee="Bob",
                    due_date="tomorrow",
                    priority="medium",
                    context="Requested by Alice"
                ),
                ActionItem(
                    description="Update documentation",
                    assignee="Bob",
                    due_date=None,
                    priority="low",
                    context="Self-assigned"
                )
            ]
        ))
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        result = await agent.extract_action_items(transcript)
        
        assert len(result) == 2
        assert result[0].assignee == "Bob"
        assert result[1].description == "Update documentation"
    
    @pytest.mark.asyncio
    async def test_extract_action_items_none_found(self, agent, sample_transcript):
        """Test when no action items are present"""
        agent.parser.parse = Mock(return_value=ActionItemsList(items=[]))
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content='{"items": []}'))
        
        result = await agent.extract_action_items(sample_transcript)
        
        assert result == []
    
    @pytest.mark.asyncio
    async def test_extract_action_items_error_handling(self, agent, sample_transcript):
        """Test error handling during extraction"""
        agent.llm.ainvoke = AsyncMock(side_effect=Exception("API Error"))
        
        result = await agent.extract_action_items(sample_transcript)
        
        assert result == []
    
    @pytest.mark.asyncio
    async def test_extract_action_items_parse_error(self, agent, sample_transcript):
        """Test handling of parse errors"""
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content="Invalid JSON"))
        agent.parser.parse = Mock(side_effect=ValueError("Parse error"))
        
        result = await agent.extract_action_items(sample_transcript)
        
        assert result == []
    
    def test_format_transcript(self, agent, sample_transcript):
        """Test transcript formatting"""
        formatted = agent._format_transcript(sample_transcript)
        
        assert "[0.0s] SPEAKER_00:" in formatted
        assert "Hello everyone" in formatted
        assert "authentication module" in formatted
    
    def test_format_transcript_empty(self, agent):
        """Test formatting empty transcript"""
        formatted = agent._format_transcript([])
        
        assert formatted == ""
    
    @pytest.mark.asyncio
    async def test_extract_with_no_assignee(self, agent):
        """Test action items without assignee"""
        transcript = [
            {
                "speaker": "SPEAKER_00",
                "start": 0.0,
                "end": 2.0,
                "text": "We need to update the server configuration.",
                "confidence": 0.9
            }
        ]
        
        agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Update server configuration",
                    assignee=None,
                    due_date=None,
                    priority="medium",
                    context="General team responsibility"
                )
            ]
        ))
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        result = await agent.extract_action_items(transcript)
        
        assert len(result) == 1
        assert result[0].assignee is None
    
    @pytest.mark.asyncio
    async def test_extract_with_priority_levels(self, agent):
        """Test different priority levels"""
        transcript = [
            {
                "speaker": "Manager",
                "start": 0.0,
                "end": 5.0,
                "text": "Critical bug needs immediate fix. Also schedule training next month.",
                "confidence": 0.9
            }
        ]
        
        agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Fix critical bug",
                    assignee=None,
                    due_date="immediate",
                    priority="high",
                    context="Bug causing production issues"
                ),
                ActionItem(
                    description="Schedule training",
                    assignee=None,
                    due_date="next month",
                    priority="low",
                    context="Team development"
                )
            ]
        ))
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        result = await agent.extract_action_items(transcript)
        
        assert len(result) == 2
        assert result[0].priority == "high"
        assert result[1].priority == "low"
    
    @pytest.mark.asyncio
    async def test_extract_preserves_context(self, agent):
        """Test that context is preserved in action items"""
        transcript = [
            {
                "speaker": "PM",
                "start": 0.0,
                "end": 3.0,
                "text": "Based on customer feedback, we should add dark mode.",
                "confidence": 0.88
            }
        ]
        
        agent.parser.parse = Mock(return_value=ActionItemsList(
            items=[
                ActionItem(
                    description="Add dark mode feature",
                    assignee="UI Team",
                    due_date=None,
                    priority="medium",
                    context="Customer feedback requested this feature"
                )
            ]
        ))
        
        agent.llm.ainvoke = AsyncMock(return_value=Mock(content="{}"))
        
        result = await agent.extract_action_items(transcript)
        
        assert "Customer feedback" in result[0].context
    
    def test_action_item_model_validation(self):
        """Test ActionItem pydantic model validation"""
        # Valid action item
        item = ActionItem(
            description="Test task",
            priority="high",
            context="Test context"
        )
        
        assert item.description == "Test task"
        assert item.priority == "high"
        assert item.assignee is None
        assert item.due_date is None
    
    def test_action_items_list_model(self):
        """Test ActionItemsList model"""
        items_list = ActionItemsList(
            items=[
                ActionItem(
                    description="Task 1",
                    priority="high",
                    context="Context 1"
                ),
                ActionItem(
                    description="Task 2",
                    priority="low",
                    context="Context 2"
                )
            ]
        )
        
        assert len(items_list.items) == 2
        assert items_list.items[0].description == "Task 1"
