"""
LLM Guardrails API - Main Application

Production-ready FastAPI application with comprehensive guardrails.
"""

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid
import time
import logging

from src.models.schemas import (
    LLMRequest,
    LLMResponse,
    HealthCheckResponse
)
from src.config.settings import get_settings
from src.guardrails.orchestrator import GuardrailOrchestrator
from src.monitoring.metrics import (
    get_metrics,
    track_request_duration,
    record_llm_request
)
from src.monitoring.logging import setup_logging, audit_logger

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting LLM Guardrails Service")
    yield
    logger.info("Shutting down LLM Guardrails Service")


app = FastAPI(
    title=settings.api_title,
    description="Production-ready LLM safety guardrails with PII detection, toxicity filtering, and rate limiting",
    version=settings.api_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize guardrail orchestrator
orchestrator = GuardrailOrchestrator()


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LLM Guardrails API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
        "tutorial": "https://crashbytes.com/articles/tutorial-production-llm-guardrails-python-fastapi-2025/",
        "github": "https://github.com/CrashBytes/tutorial-llm-guardrails-production"
    }


@app.get("/health", response_model=HealthCheckResponse)
@track_request_duration("health")
async def health_check():
    """
    Health check endpoint with dependency status.
    
    Returns service health and configuration status.
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.api_version,
        guardrails_enabled={
            "pii_detection": settings.enable_pii_detection,
            "toxicity_filtering": settings.enable_toxicity_filtering,
            "rate_limiting": settings.enable_rate_limiting,
            "prompt_injection_detection": settings.enable_prompt_injection_detection
        },
        dependencies={
            "redis": True,  # Would check actual Redis connection
            "models": True   # Would check if ML models are loaded
        }
    )


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    
    Returns metrics in Prometheus exposition format.
    """
    return Response(
        content=get_metrics(),
        media_type="text/plain"
    )


@app.post("/api/v1/completions", response_model=LLMResponse)
@track_request_duration("completions")
async def create_completion(request: LLMRequest):
    """
    Generate LLM completion with guardrails.
    
    This endpoint:
    1. Runs pre-processing guardrails (PII, toxicity, rate limiting)
    2. Calls LLM API if guardrails pass
    3. Runs post-processing guardrails on output
    4. Returns completion or blocks based on guardrail results
    
    Args:
        request: LLM request with prompt and configuration
        
    Returns:
        LLM response with completion and guardrail results
        
    Raises:
        HTTPException: If request is blocked by guardrails
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Log request
    audit_logger.log_request(
        user_id=request.user_id,
        request_id=request_id,
        endpoint="completions",
        provider=request.provider.value,
        model=request.model or settings.default_model
    )
    
    try:
        # Run input guardrails
        input_check = await orchestrator.check_input_guardrails(request)
        
        # Log violations
        for violation in input_check.violations:
            audit_logger.log_guardrail_violation(
                user_id=request.user_id,
                request_id=request_id,
                guardrail_type=violation.guardrail_type,
                severity=violation.severity,
                details=violation.details
            )
        
        # Block if guardrails failed
        if not input_check.passed:
            logger.warning(
                f"Request {request_id} blocked by input guardrails: "
                f"{len(input_check.violations)} violations"
            )
            
            return LLMResponse(
                completion=None,
                blocked=True,
                input_guardrails=input_check,
                output_guardrails=None,
                total_processing_time_ms=(time.time() - start_time) * 1000,
                model_used=request.model or settings.default_model,
                tokens_used=0,
                request_id=request_id
            )
        
        # Generate LLM completion (placeholder)
        # In production, this would call OpenAI/Anthropic API
        completion_text = _generate_completion_placeholder(request)
        
        # Record LLM request
        record_llm_request(
            provider=request.provider.value,
            model=request.model or settings.default_model,
            status="success",
            tokens=len(completion_text.split())  # Rough estimate
        )
        
        # Run output guardrails
        output_check = await orchestrator.check_output_guardrails(
            output=completion_text,
            user_id=request.user_id
        )
        
        # Block if output guardrails failed
        if not output_check.passed:
            logger.warning(
                f"Request {request_id} blocked by output guardrails"
            )
            
            return LLMResponse(
                completion=None,
                blocked=True,
                input_guardrails=input_check,
                output_guardrails=output_check,
                total_processing_time_ms=(time.time() - start_time) * 1000,
                model_used=request.model or settings.default_model,
                tokens_used=0,
                request_id=request_id
            )
        
        # Return successful completion
        total_time = (time.time() - start_time) * 1000
        
        return LLMResponse(
            completion=completion_text,
            blocked=False,
            input_guardrails=input_check,
            output_guardrails=output_check,
            total_processing_time_ms=total_time,
            model_used=request.model or settings.default_model,
            tokens_used=len(completion_text.split()),
            request_id=request_id
        )
    
    except Exception as e:
        logger.error(f"Error processing request {request_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


def _generate_completion_placeholder(request: LLMRequest) -> str:
    """
    Placeholder for LLM API call.
    
    In production, this would call OpenAI, Anthropic, or other LLM providers.
    """
    return (
        f"This is a placeholder completion for the prompt: '{request.prompt[:50]}...'\n\n"
        f"In production, this would be replaced with actual LLM API calls to "
        f"{request.provider.value}. See the full tutorial at "
        f"https://crashbytes.com/articles/tutorial-production-llm-guardrails-python-fastapi-2025/"
        f"for complete implementation including OpenAI and Anthropic integrations."
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level.lower()
    )
