"""
FastAPI Application - REST API for AI Agent

Provides HTTP endpoints for interacting with the AI agent.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging
import time
from contextlib import asynccontextmanager

from ..agents.executor import AgentExecutor
from ..agents.config import get_settings
from ..tools.search_tool import WebSearchTool, WebContentFetcherTool
from ..memory.redis_memory import RedisConversationMemory

# Configure logging
logger = logging.getLogger(__name__)

# Global instances (initialized on startup)
agent_executor: Optional[AgentExecutor] = None
memory: Optional[RedisConversationMemory] = None


# =============================================================================
# Lifespan Management
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting AI Agent API...")
    
    settings = get_settings()
    
    # Initialize memory
    global memory
    memory = RedisConversationMemory(
        redis_url=settings.get_redis_url(),
        ttl_seconds=settings.memory_ttl_seconds,
        max_messages=settings.max_history_messages
    )
    await memory.initialize()
    logger.info("Memory initialized")
    
    # Initialize tools
    tools = [
        WebSearchTool(
            max_results=settings.web_search_max_results,
            timeout_seconds=settings.web_search_timeout
        ),
        WebContentFetcherTool()
    ]
    logger.info(f"Initialized {len(tools)} tools")
    
    # Initialize agent
    global agent_executor
    agent_executor = AgentExecutor(
        tools=tools,
        memory=memory,
        temperature=settings.llm_temperature,
        max_iterations=settings.agent_max_iterations
    )
    logger.info("Agent executor initialized")
    
    logger.info("AI Agent API ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Agent API...")
    if memory:
        await memory.close()
    logger.info("Shutdown complete")


# =============================================================================
# FastAPI App
# =============================================================================


app = FastAPI(
    title="AI Agent API",
    description="Production AI Agent with LangChain and Tools",
    version="1.0.0",
    lifespan=lifespan
)

# Get settings
settings = get_settings()

# Configure CORS
if settings.enable_cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# =============================================================================
# Request/Response Models
# =============================================================================


class AgentRequest(BaseModel):
    """Request model for agent execution"""
    query: str = Field(..., description="User query or instruction")
    conversation_id: Optional[str] = Field(
        None,
        description="Conversation ID for maintaining context"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional metadata (user_id, session_id, etc.)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "Search for the latest AI news and summarize",
                "conversation_id": "user-123-session-456",
                "metadata": {
                    "user_id": "user-123",
                    "source": "web"
                }
            }
        }


class AgentResponse(BaseModel):
    """Response model for agent execution"""
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    tools_used: Optional[List[str]] = None
    conversation_id: Optional[str] = None
    execution_time_ms: Optional[float] = None
    model: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: float
    components: Dict[str, str]


class ConversationHistoryResponse(BaseModel):
    """Conversation history response"""
    conversation_id: str
    messages: List[Dict[str, Any]]
    total_messages: int


# =============================================================================
# API Endpoints
# =============================================================================


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "AI Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns status of all system components.
    """
    components = {}
    
    # Check agent
    components["agent"] = "ok" if agent_executor else "not initialized"
    
    # Check memory
    components["memory"] = "ok" if memory else "not initialized"
    
    # Check Redis connection
    try:
        if memory and memory.client:
            await memory.client.ping()
            components["redis"] = "ok"
        else:
            components["redis"] = "not initialized"
    except Exception as e:
        components["redis"] = f"error: {str(e)}"
    
    # Overall status
    overall_status = "healthy" if all(
        v in ["ok", "not initialized"] for v in components.values()
    ) else "unhealthy"
    
    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        timestamp=time.time(),
        components=components
    )


@app.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes.
    
    Returns 200 if ready to serve traffic, 503 otherwise.
    """
    if agent_executor and memory:
        return {"status": "ready"}
    else:
        raise HTTPException(
            status_code=503,
            detail="Service not ready"
        )


@app.post("/agent/execute", response_model=AgentResponse)
async def execute_agent(request: AgentRequest):
    """
    Execute agent with query.
    
    The agent will use available tools as needed and maintain
    conversation context if a conversation_id is provided.
    """
    if not agent_executor:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized"
        )
    
    start_time = time.time()
    
    try:
        # Execute agent
        result = await agent_executor.execute(
            query=request.query,
            conversation_id=request.conversation_id,
            metadata=request.metadata
        )
        
        execution_time_ms = (time.time() - start_time) * 1000
        
        # Add execution time to result
        result["execution_time_ms"] = execution_time_ms
        
        logger.info(
            "Agent execution completed",
            extra={
                "conversation_id": request.conversation_id,
                "execution_time_ms": execution_time_ms,
                "success": result["success"]
            }
        )
        
        return AgentResponse(**result)
    
    except Exception as e:
        logger.error(
            f"Agent execution failed: {e}",
            extra={"query": request.query},
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/conversation/{conversation_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: str,
    limit: Optional[int] = None
):
    """
    Retrieve conversation history.
    
    Args:
        conversation_id: Conversation identifier
        limit: Optional limit on number of messages
    """
    if not memory:
        raise HTTPException(
            status_code=503,
            detail="Memory not initialized"
        )
    
    try:
        messages = await memory.get_history(conversation_id, limit=limit)
        
        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=messages,
            total_messages=len(messages)
        )
    
    except Exception as e:
        logger.error(f"Failed to get conversation history: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.delete("/conversation/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """
    Clear conversation history.
    
    Args:
        conversation_id: Conversation identifier
    """
    if not memory:
        raise HTTPException(
            status_code=503,
            detail="Memory not initialized"
        )
    
    try:
        await memory.clear_history(conversation_id)
        return {"status": "success", "conversation_id": conversation_id}
    
    except Exception as e:
        logger.error(f"Failed to clear conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/tools")
async def list_tools():
    """List available tools and their status"""
    if not agent_executor:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized"
        )
    
    tools_info = [
        tool.get_metrics_summary()
        for tool in agent_executor.tools
    ]
    
    return {
        "total_tools": len(tools_info),
        "tools": tools_info
    }


@app.get("/metrics")
async def get_metrics():
    """
    Get system metrics (Prometheus compatible).
    
    Returns metrics in Prometheus exposition format.
    """
    # In production, use prometheus_client to generate proper metrics
    # This is a simplified example
    
    if not agent_executor:
        return "# Agent not initialized\n"
    
    metrics_lines = []
    
    # Tool metrics
    for tool in agent_executor.tools:
        tool_name = tool.name
        metrics = tool.metrics
        
        metrics_lines.append(
            f'tool_execution_count{{tool="{tool_name}"}} {metrics.execution_count}'
        )
        metrics_lines.append(
            f'tool_error_count{{tool="{tool_name}"}} {metrics.error_count}'
        )
        metrics_lines.append(
            f'tool_avg_duration_ms{{tool="{tool_name}"}} {metrics.get_average_duration_ms()}'
        )
    
    return "\n".join(metrics_lines)


# =============================================================================
# Error Handlers
# =============================================================================


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Handle unexpected exceptions"""
    logger.error(
        f"Unexpected error: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An error occurred"
        }
    )


# =============================================================================
# Run Server
# =============================================================================


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.auto_reload,
        log_level=settings.log_level.lower()
    )
