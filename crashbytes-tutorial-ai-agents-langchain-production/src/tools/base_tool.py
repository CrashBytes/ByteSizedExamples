"""
Base Tool Implementation with Validation and Monitoring

All agent tools inherit from this base class to ensure consistent
error handling, validation, and metrics collection.
"""

from typing import Any, Dict, Optional, Callable
from pydantic import BaseModel, Field
import logging
from functools import wraps
import time
from datetime import datetime

logger = logging.getLogger(__name__)


class ToolMetrics(BaseModel):
    """
    Metrics for tool execution.
    
    Tracks performance and reliability of individual tools.
    """
    execution_count: int = 0
    total_duration_ms: float = 0.0
    error_count: int = 0
    last_execution_time: Optional[float] = None
    last_error: Optional[str] = None
    last_error_time: Optional[float] = None
    
    def get_average_duration_ms(self) -> float:
        """Calculate average execution duration"""
        if self.execution_count == 0:
            return 0.0
        return self.total_duration_ms / self.execution_count
    
    def get_error_rate(self) -> float:
        """Calculate error rate percentage"""
        if self.execution_count == 0:
            return 0.0
        return (self.error_count / self.execution_count) * 100


def track_tool_execution(func: Callable):
    """
    Decorator to track tool execution metrics.
    
    Automatically measures execution time and captures errors.
    """
    @wraps(func)
    async def wrapper(self, *args, **kwargs):
        start_time = time.time()
        try:
            result = await func(self, *args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            # Update success metrics
            self.metrics.execution_count += 1
            self.metrics.total_duration_ms += duration_ms
            self.metrics.last_execution_time = time.time()
            
            logger.info(
                f"Tool '{self.name}' executed successfully",
                extra={
                    "tool_name": self.name,
                    "duration_ms": duration_ms,
                    "execution_count": self.metrics.execution_count
                }
            )
            return result
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            # Update error metrics
            self.metrics.error_count += 1
            self.metrics.last_error = str(e)
            self.metrics.last_error_time = time.time()
            
            logger.error(
                f"Tool '{self.name}' failed",
                extra={
                    "tool_name": self.name,
                    "duration_ms": duration_ms,
                    "error": str(e),
                    "error_count": self.metrics.error_count
                },
                exc_info=True
            )
            raise
    return wrapper


class BaseTool(BaseModel):
    """
    Base class for all agent tools.
    
    Provides:
    - Input validation
    - Error handling
    - Performance monitoring
    - Enable/disable functionality
    - Consistent interface for LangChain
    
    All tools must implement _execute() method.
    """
    
    name: str = Field(..., description="Tool name - must be unique")
    description: str = Field(
        ...,
        description="Tool description for the agent (what it does and when to use it)"
    )
    metrics: ToolMetrics = Field(
        default_factory=ToolMetrics,
        description="Tool execution metrics"
    )
    enabled: bool = Field(
        default=True,
        description="Whether tool is currently enabled"
    )
    return_direct: bool = Field(
        default=False,
        description="Whether to return tool output directly without further agent processing"
    )
    
    class Config:
        arbitrary_types_allowed = True
    
    def validate_input(self, **kwargs) -> bool:
        """
        Validate tool input parameters.
        
        Override in subclasses for tool-specific validation logic.
        
        Args:
            **kwargs: Tool-specific parameters to validate
            
        Returns:
            bool: True if input is valid, False otherwise
        """
        return True
    
    @track_tool_execution
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute tool with input validation and error handling.
        
        This is the main entry point for tool execution.
        Do not override this method - override _execute() instead.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            Dict containing tool execution results
            
        Raises:
            ValueError: If tool is disabled or input is invalid
            Exception: Any exception from tool execution
        """
        if not self.enabled:
            raise ValueError(f"Tool '{self.name}' is currently disabled")
        
        if not self.validate_input(**kwargs):
            raise ValueError(f"Invalid input for tool '{self.name}': {kwargs}")
        
        logger.debug(
            f"Executing tool '{self.name}'",
            extra={"tool_name": self.name, "input": kwargs}
        )
        
        return await self._execute(**kwargs)
    
    async def _execute(self, **kwargs) -> Dict[str, Any]:
        """
        Tool-specific execution logic.
        
        MUST be implemented by subclasses.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            Dict containing execution results with at least:
                - success: bool
                - Additional tool-specific data
        """
        raise NotImplementedError(
            f"Tool '{self.name}' must implement _execute() method"
        )
    
    def disable(self):
        """Disable this tool"""
        self.enabled = False
        logger.info(f"Tool '{self.name}' disabled")
    
    def enable(self):
        """Enable this tool"""
        self.enabled = True
        logger.info(f"Tool '{self.name}' enabled")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get tool metrics summary.
        
        Returns:
            Dict with metrics information
        """
        return {
            "name": self.name,
            "enabled": self.enabled,
            "execution_count": self.metrics.execution_count,
            "error_count": self.metrics.error_count,
            "error_rate": self.metrics.get_error_rate(),
            "avg_duration_ms": self.metrics.get_average_duration_ms(),
            "last_execution_time": (
                datetime.fromtimestamp(self.metrics.last_execution_time).isoformat()
                if self.metrics.last_execution_time
                else None
            )
        }
    
    def to_langchain_tool(self):
        """
        Convert to LangChain tool format.
        
        This allows the tool to be used with LangChain agents.
        """
        from langchain.tools import Tool
        
        async def run_tool(**kwargs):
            return await self.execute(**kwargs)
        
        return Tool(
            name=self.name,
            description=self.description,
            func=run_tool,
            return_direct=self.return_direct
        )


# Example usage
if __name__ == "__main__":
    # Example of how to create a custom tool
    class ExampleTool(BaseTool):
        name = "example_tool"
        description = "An example tool for demonstration"
        
        def validate_input(self, input_text: str = None, **kwargs) -> bool:
            return input_text is not None and len(input_text) > 0
        
        async def _execute(self, input_text: str, **kwargs) -> Dict[str, Any]:
            return {
                "success": True,
                "result": f"Processed: {input_text}"
            }
    
    import asyncio
    
    async def test():
        tool = ExampleTool()
        result = await tool.execute(input_text="Hello")
        print(result)
        print(tool.get_metrics_summary())
    
    asyncio.run(test())
