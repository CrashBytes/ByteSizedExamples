"""
Tests for AI Agent System

Run with: pytest tests/test_agent.py -v
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock

# Import components to test
from src.agents.executor import AgentExecutor
from src.agents.config import AgentSettings
from src.tools.base_tool import BaseTool, ToolMetrics
from src.tools.search_tool import WebSearchTool
from src.memory.redis_memory import RedisConversationMemory


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    return AgentSettings(
        openai_api_key="test-key",
        postgres_password="test-password",
        redis_url="redis://localhost:6379/0",
        default_model="gpt-4-turbo-preview"
    )


@pytest.fixture
def mock_tool():
    """Mock tool for testing"""
    class MockTool(BaseTool):
        name = "mock_tool"
        description = "A mock tool for testing"
        
        async def _execute(self, **kwargs):
            return {"success": True, "result": "mock result"}
    
    return MockTool()


@pytest.fixture
async def redis_memory():
    """Redis memory instance for testing"""
    memory = RedisConversationMemory(
        redis_url="redis://localhost:6379/0",
        ttl_seconds=3600,
        max_messages=20
    )
    
    try:
        await memory.initialize()
        yield memory
    finally:
        await memory.close()


# =============================================================================
# Tool Tests
# =============================================================================


class TestBaseTool:
    """Test BaseTool functionality"""
    
    @pytest.mark.asyncio
    async def test_tool_execution(self, mock_tool):
        """Test basic tool execution"""
        result = await mock_tool.execute()
        assert result["success"] is True
        assert result["result"] == "mock result"
    
    @pytest.mark.asyncio
    async def test_tool_metrics_tracking(self, mock_tool):
        """Test that metrics are tracked"""
        await mock_tool.execute()
        
        metrics = mock_tool.get_metrics_summary()
        assert metrics["execution_count"] == 1
        assert metrics["error_count"] == 0
        assert metrics["enabled"] is True
    
    @pytest.mark.asyncio
    async def test_tool_disable(self, mock_tool):
        """Test tool can be disabled"""
        mock_tool.disable()
        
        with pytest.raises(ValueError, match="disabled"):
            await mock_tool.execute()
    
    @pytest.mark.asyncio
    async def test_tool_validation(self):
        """Test tool input validation"""
        class ValidatedTool(BaseTool):
            name = "validated_tool"
            description = "Tool with validation"
            
            def validate_input(self, value: int = None, **kwargs):
                return value is not None and value > 0
            
            async def _execute(self, value: int, **kwargs):
                return {"success": True, "value": value * 2}
        
        tool = ValidatedTool()
        
        # Valid input
        result = await tool.execute(value=5)
        assert result["value"] == 10
        
        # Invalid input
        with pytest.raises(ValueError, match="Invalid input"):
            await tool.execute(value=-1)


class TestWebSearchTool:
    """Test WebSearchTool"""
    
    @pytest.mark.asyncio
    async def test_search_validation(self):
        """Test search query validation"""
        tool = WebSearchTool()
        
        # Valid queries
        assert tool.validate_input(query="Python tutorials") is True
        
        # Invalid queries
        assert tool.validate_input(query="ab") is False  # Too short
        assert tool.validate_input(query="") is False  # Empty
        assert tool.validate_input() is False  # Missing
    
    @pytest.mark.asyncio
    async def test_search_execution(self):
        """Test search execution returns proper structure"""
        tool = WebSearchTool()
        result = await tool.execute(query="Python programming")
        
        assert "success" in result
        assert "query" in result
        assert "results" in result
        assert isinstance(result["results"], list)


# =============================================================================
# Memory Tests
# =============================================================================


class TestRedisMemory:
    """Test Redis conversation memory"""
    
    @pytest.mark.asyncio
    async def test_add_and_retrieve_message(self, redis_memory):
        """Test adding and retrieving messages"""
        conv_id = "test-conv-123"
        
        # Add message
        await redis_memory.add_message(
            conv_id,
            "user",
            "Hello, how are you?",
            metadata={"user_id": "user-456"}
        )
        
        # Retrieve history
        history = await redis_memory.get_history(conv_id)
        
        assert len(history) == 1
        assert history[0]["role"] == "user"
        assert history[0]["content"] == "Hello, how are you?"
        assert history[0]["metadata"]["user_id"] == "user-456"
        
        # Cleanup
        await redis_memory.clear_history(conv_id)
    
    @pytest.mark.asyncio
    async def test_message_limit(self, redis_memory):
        """Test message limit enforcement"""
        conv_id = "test-conv-limit"
        
        # Add more messages than the limit
        for i in range(25):
            await redis_memory.add_message(
                conv_id,
                "user",
                f"Message {i}"
            )
        
        # Should only keep max_messages (20)
        history = await redis_memory.get_history(conv_id)
        assert len(history) == 20
        
        # Should have the most recent messages
        assert history[-1]["content"] == "Message 24"
        
        # Cleanup
        await redis_memory.clear_history(conv_id)
    
    @pytest.mark.asyncio
    async def test_clear_history(self, redis_memory):
        """Test clearing conversation history"""
        conv_id = "test-conv-clear"
        
        # Add messages
        await redis_memory.add_message(conv_id, "user", "Test message")
        
        # Verify exists
        history = await redis_memory.get_history(conv_id)
        assert len(history) == 1
        
        # Clear
        await redis_memory.clear_history(conv_id)
        
        # Verify cleared
        history = await redis_memory.get_history(conv_id)
        assert len(history) == 0
    
    @pytest.mark.asyncio
    async def test_last_message(self, redis_memory):
        """Test getting last message"""
        conv_id = "test-conv-last"
        
        # Add messages
        await redis_memory.add_message(conv_id, "user", "First message")
        await redis_memory.add_message(conv_id, "assistant", "Second message")
        
        # Get last message
        last_msg = await redis_memory.get_last_message(conv_id)
        
        assert last_msg is not None
        assert last_msg["role"] == "assistant"
        assert last_msg["content"] == "Second message"
        
        # Cleanup
        await redis_memory.clear_history(conv_id)


# =============================================================================
# Agent Tests
# =============================================================================


class TestAgentExecutor:
    """Test AgentExecutor"""
    
    @pytest.mark.asyncio
    async def test_agent_initialization(self, mock_tool):
        """Test agent can be initialized"""
        with patch('src.agents.executor.get_settings') as mock_get_settings:
            mock_get_settings.return_value = AgentSettings(
                openai_api_key="test-key",
                postgres_password="test-password"
            )
            
            agent = AgentExecutor(tools=[mock_tool])
            
            assert agent.model_name is not None
            assert len(agent.tools) == 1
            assert agent.max_iterations > 0
    
    @pytest.mark.asyncio
    async def test_agent_execution_structure(self, mock_tool):
        """Test agent execution returns proper structure"""
        with patch('src.agents.executor.get_settings') as mock_get_settings:
            mock_get_settings.return_value = AgentSettings(
                openai_api_key="test-key",
                postgres_password="test-password"
            )
            
            # Mock LLM calls
            with patch('src.agents.executor.LangChainAgentExecutor') as mock_executor:
                mock_executor.return_value.ainvoke = AsyncMock(
                    return_value={
                        "output": "Test response",
                        "intermediate_steps": []
                    }
                )
                
                agent = AgentExecutor(tools=[mock_tool])
                result = await agent.execute(
                    query="Test query",
                    conversation_id="test-123"
                )
                
                assert "success" in result
                assert "response" in result
                assert result["conversation_id"] == "test-123"


# =============================================================================
# Integration Tests
# =============================================================================


class TestIntegration:
    """Integration tests for full system"""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_agent_with_memory(self, mock_tool, redis_memory):
        """Test agent with memory integration"""
        with patch('src.agents.executor.get_settings') as mock_get_settings:
            mock_get_settings.return_value = AgentSettings(
                openai_api_key="test-key",
                postgres_password="test-password"
            )
            
            # Mock LLM
            with patch('src.agents.executor.LangChainAgentExecutor') as mock_executor:
                mock_executor.return_value.ainvoke = AsyncMock(
                    return_value={
                        "output": "Test response",
                        "intermediate_steps": []
                    }
                )
                
                agent = AgentExecutor(tools=[mock_tool], memory=redis_memory)
                
                # Execute query
                result = await agent.execute(
                    query="Test query",
                    conversation_id="test-integration"
                )
                
                assert result["success"] is True
                
                # Check memory
                history = await redis_memory.get_history("test-integration")
                assert len(history) == 2  # User query + assistant response
                
                # Cleanup
                await redis_memory.clear_history("test-integration")


# =============================================================================
# Run Tests
# =============================================================================


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
