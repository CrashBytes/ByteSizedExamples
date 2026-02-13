"""
Agent Executor - Main Agent Logic

Orchestrates LLM calls with tools and memory for multi-step reasoning.
"""

from typing import List, Dict, Any, Optional
import logging
from langchain.agents import AgentExecutor as LangChainAgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage, SystemMessage

from ..tools.base_tool import BaseTool
from ..memory.redis_memory import RedisConversationMemory
from .config import get_settings
from .prompts import get_agent_system_prompt

logger = logging.getLogger(__name__)


class AgentExecutor:
    """
    Main agent executor that orchestrates LLM with tools and memory.
    
    Features:
    - Multi-step reasoning with tool use
    - Conversation memory management
    - Error handling and retries
    - Performance monitoring
    - Support for multiple LLM providers
    """
    
    def __init__(
        self,
        tools: List[BaseTool],
        model: Optional[str] = None,
        memory: Optional[RedisConversationMemory] = None,
        temperature: Optional[float] = None,
        max_iterations: Optional[int] = None,
        timeout_seconds: Optional[int] = None
    ):
        """
        Initialize agent executor.
        
        Args:
            tools: List of tools available to the agent
            model: LLM model name (default from config)
            memory: Memory instance (optional)
            temperature: LLM temperature (default from config)
            max_iterations: Maximum agent iterations (default from config)
            timeout_seconds: Execution timeout (default from config)
        """
        self.settings = get_settings()
        self.tools = tools
        self.memory = memory
        
        # Configuration
        self.model_name = model or self.settings.default_model
        self.temperature = temperature or self.settings.llm_temperature
        self.max_iterations = max_iterations or self.settings.agent_max_iterations
        self.timeout_seconds = timeout_seconds or self.settings.agent_timeout_seconds
        
        # Initialize LLM
        self.llm = self._initialize_llm()
        
        # Initialize LangChain agent
        self.langchain_tools = [tool.to_langchain_tool() for tool in tools]
        self.agent = self._create_agent()
        
        logger.info(
            "AgentExecutor initialized",
            extra={
                "model": self.model_name,
                "num_tools": len(tools),
                "max_iterations": self.max_iterations
            }
        )
    
    def _initialize_llm(self):
        """Initialize LLM based on model name"""
        if "gpt" in self.model_name.lower():
            return ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                api_key=self.settings.openai_api_key,
                max_tokens=self.settings.llm_max_tokens
            )
        elif "claude" in self.model_name.lower():
            return ChatAnthropic(
                model=self.model_name,
                temperature=self.temperature,
                api_key=self.settings.anthropic_api_key,
                max_tokens=self.settings.llm_max_tokens
            )
        else:
            raise ValueError(f"Unsupported model: {self.model_name}")
    
    def _create_agent(self):
        """Create LangChain agent with tools"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", get_agent_system_prompt()),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.langchain_tools,
            prompt=prompt
        )
        
        return LangChainAgentExecutor(
            agent=agent,
            tools=self.langchain_tools,
            max_iterations=self.max_iterations,
            verbose=self.settings.debug,
            return_intermediate_steps=True
        )
    
    async def execute(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute agent with query.
        
        Args:
            query: User query/instruction
            conversation_id: Optional conversation ID for memory
            metadata: Optional metadata
            
        Returns:
            Dict with response and execution details
        """
        logger.info(
            "Agent execution started",
            extra={
                "query": query[:100],
                "conversation_id": conversation_id
            }
        )
        
        try:
            # Get conversation history if memory enabled
            chat_history = []
            if self.memory and conversation_id:
                history = await self.memory.get_history(conversation_id, limit=10)
                chat_history = self._convert_history_to_messages(history)
            
            # Execute agent
            result = await self.agent.ainvoke({
                "input": query,
                "chat_history": chat_history
            })
            
            # Store in memory if enabled
            if self.memory and conversation_id:
                await self.memory.add_message(
                    conversation_id,
                    "user",
                    query,
                    metadata=metadata
                )
                await self.memory.add_message(
                    conversation_id,
                    "assistant",
                    result["output"],
                    metadata={"model": self.model_name}
                )
            
            # Extract tool usage
            tools_used = self._extract_tools_used(result.get("intermediate_steps", []))
            
            logger.info(
                "Agent execution completed",
                extra={
                    "conversation_id": conversation_id,
                    "tools_used": tools_used
                }
            )
            
            return {
                "success": True,
                "response": result["output"],
                "tools_used": tools_used,
                "conversation_id": conversation_id,
                "model": self.model_name
            }
            
        except Exception as e:
            logger.error(
                f"Agent execution failed: {e}",
                extra={"query": query, "conversation_id": conversation_id},
                exc_info=True
            )
            
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "conversation_id": conversation_id
            }
    
    def _convert_history_to_messages(self, history: List[Dict]) -> List:
        """Convert memory history to LangChain messages"""
        messages = []
        for msg in history:
            role = msg["role"]
            content = msg["content"]
            
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
            elif role == "system":
                messages.append(SystemMessage(content=content))
        
        return messages
    
    def _extract_tools_used(self, intermediate_steps: List) -> List[str]:
        """Extract list of tools used from intermediate steps"""
        tools_used = []
        for step in intermediate_steps:
            if len(step) >= 1 and hasattr(step[0], "tool"):
                tools_used.append(step[0].tool)
        return list(set(tools_used))  # Deduplicate


# Example usage
if __name__ == "__main__":
    import asyncio
    from ..tools.search_tool import WebSearchTool
    
    async def test_agent():
        # Initialize tools
        tools = [WebSearchTool()]
        
        # Initialize agent
        agent = AgentExecutor(tools=tools)
        
        # Execute query
        result = await agent.execute(
            query="Search for the latest news about artificial intelligence",
            conversation_id="test-123"
        )
        
        print("\nAgent Response:")
        print(result)
    
    asyncio.run(test_agent())
