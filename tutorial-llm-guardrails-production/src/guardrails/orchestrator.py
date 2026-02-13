"""
Guardrail Orchestration Layer

Coordinates all guardrail checks in the correct order with proper error handling.
"""

from typing import List, Optional
import time
import logging
from datetime import datetime

from src.models.schemas import (
    GuardrailCheckResult,
    GuardrailViolation,
    LLMRequest
)
from src.config.settings import get_settings
from src.guardrails.pii_detector import get_pii_detector
from src.guardrails.toxicity_detector import get_toxicity_detector
from src.guardrails.rate_limiter import get_rate_limiter
from src.monitoring.metrics import (
    record_guardrail_check,
    record_guardrail_violation
)

logger = logging.getLogger(__name__)


class GuardrailOrchestrator:
    """
    Orchestrates all guardrail checks with performance monitoring.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.pii_detector = get_pii_detector()
        self.toxicity_detector = get_toxicity_detector()
    
    async def check_input_guardrails(
        self,
        request: LLMRequest
    ) -> GuardrailCheckResult:
        """
        Run all pre-processing guardrails on user input.
        
        Args:
            request: LLM request to validate
            
        Returns:
            GuardrailCheckResult with pass/fail and violations
        """
        start_time = time.time()
        violations: List[GuardrailViolation] = []
        modified_content = request.prompt
        
        # Check rate limiting first (fastest check)
        if self.settings.enable_rate_limiting:
            rate_limit_violation = await self._check_rate_limit(request)
            if rate_limit_violation:
                violations.append(rate_limit_violation)
                record_guardrail_violation(
                    'rate_limiting',
                    rate_limit_violation.severity
                )
        
        # Check PII detection
        if self.settings.enable_pii_detection:
            pii_violation, redacted = await self._check_pii(request.prompt)
            if pii_violation:
                violations.append(pii_violation)
                modified_content = redacted if redacted else modified_content
                record_guardrail_violation(
                    'pii_detection',
                    pii_violation.severity
                )
        
        # Check toxicity
        if self.settings.enable_toxicity_filtering:
            toxicity_violation = await self._check_toxicity(request.prompt)
            if toxicity_violation:
                violations.append(toxicity_violation)
                record_guardrail_violation(
                    'toxicity_filtering',
                    toxicity_violation.severity
                )
        
        processing_time_ms = (time.time() - start_time) * 1000
        passed = len(violations) == 0
        
        # Record metrics
        record_guardrail_check('input_guardrails', passed, processing_time_ms / 1000)
        
        return GuardrailCheckResult(
            passed=passed,
            violations=violations,
            modified_content=modified_content if not passed else None,
            processing_time_ms=processing_time_ms
        )
    
    async def check_output_guardrails(
        self,
        output: str,
        user_id: str
    ) -> GuardrailCheckResult:
        """
        Run all post-processing guardrails on LLM output.
        
        Args:
            output: LLM-generated text
            user_id: User identifier for logging
            
        Returns:
            GuardrailCheckResult with pass/fail and violations
        """
        start_time = time.time()
        violations: List[GuardrailViolation] = []
        
        # Check output toxicity if enabled
        if self.settings.toxicity_check_output:
            toxicity_violation = await self._check_toxicity(output)
            if toxicity_violation:
                violations.append(toxicity_violation)
                record_guardrail_violation(
                    'output_toxicity',
                    toxicity_violation.severity
                )
        
        processing_time_ms = (time.time() - start_time) * 1000
        passed = len(violations) == 0
        
        # Record metrics
        record_guardrail_check('output_guardrails', passed, processing_time_ms / 1000)
        
        return GuardrailCheckResult(
            passed=passed,
            violations=violations,
            modified_content=None,
            processing_time_ms=processing_time_ms
        )
    
    async def _check_rate_limit(
        self,
        request: LLMRequest
    ) -> Optional[GuardrailViolation]:
        """Check rate limiting"""
        try:
            rate_limiter = await get_rate_limiter()
            is_allowed, limit_info = await rate_limiter.check_rate_limit(
                request.user_id,
                "llm_completion"
            )
            
            if not is_allowed:
                return GuardrailViolation(
                    guardrail_type="rate_limiting",
                    severity="high",
                    message="Rate limit exceeded",
                    details=limit_info,
                    timestamp=datetime.utcnow()
                )
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
        
        return None
    
    async def _check_pii(
        self,
        text: str
    ) -> tuple[Optional[GuardrailViolation], Optional[str]]:
        """Check for PII and return violation + redacted text"""
        try:
            redacted_text, detected_pii = await self.pii_detector.redact_pii(text)
            
            if detected_pii:
                return (
                    GuardrailViolation(
                        guardrail_type="pii_detection",
                        severity="high",
                        message=f"Detected {len(detected_pii)} PII entities",
                        details={
                            'entities': [e.get('entity_type') for e in detected_pii]
                        },
                        timestamp=datetime.utcnow()
                    ),
                    redacted_text
                )
        except Exception as e:
            logger.error(f"PII detection error: {e}")
            return (
                GuardrailViolation(
                    guardrail_type="pii_detection",
                    severity="critical",
                    message="PII detection service unavailable",
                    details={'error': str(e)},
                    timestamp=datetime.utcnow()
                ),
                None
            )
        
        return None, None
    
    async def _check_toxicity(
        self,
        text: str
    ) -> Optional[GuardrailViolation]:
        """Check for toxic content"""
        try:
            is_toxic, scores = await self.toxicity_detector.is_toxic(text)
            
            if is_toxic:
                return GuardrailViolation(
                    guardrail_type="toxicity_filtering",
                    severity="high",
                    message="Toxic content detected",
                    details={
                        'scores': scores,
                        'max_score': max(scores.values()),
                        'threshold': self.settings.toxicity_threshold
                    },
                    timestamp=datetime.utcnow()
                )
        except Exception as e:
            logger.error(f"Toxicity detection error: {e}")
            return GuardrailViolation(
                guardrail_type="toxicity_filtering",
                severity="critical",
                message="Toxicity detection service unavailable",
                details={'error': str(e)},
                timestamp=datetime.utcnow()
            )
        
        return None
