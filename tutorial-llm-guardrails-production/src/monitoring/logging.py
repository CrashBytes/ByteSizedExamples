"""
Structured Logging Configuration

JSON-formatted logging for production observability.
"""

import logging
import sys
from pythonjsonlogger import jsonlogger
from typing import Optional

from src.config.settings import get_settings


def setup_logging():
    """
    Configure structured JSON logging for the application.
    
    Logs include timestamp, level, message, and contextual information.
    """
    settings = get_settings()
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create JSON formatter
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler for audit logs (if enabled)
    if settings.enable_audit_logging:
        file_handler = logging.FileHandler('logs/audit.log')
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class AuditLogger:
    """
    Specialized logger for audit trail events.
    
    Logs security-relevant events like guardrail violations,
    blocked requests, and PII detections.
    """
    
    def __init__(self):
        self.logger = get_logger('audit')
    
    def log_request(
        self,
        user_id: str,
        request_id: str,
        endpoint: str,
        **kwargs
    ):
        """Log an API request"""
        self.logger.info(
            'api_request',
            extra={
                'user_id': user_id,
                'request_id': request_id,
                'endpoint': endpoint,
                **kwargs
            }
        )
    
    def log_guardrail_violation(
        self,
        user_id: str,
        request_id: str,
        guardrail_type: str,
        severity: str,
        details: Optional[dict] = None
    ):
        """Log a guardrail violation"""
        self.logger.warning(
            'guardrail_violation',
            extra={
                'user_id': user_id,
                'request_id': request_id,
                'guardrail_type': guardrail_type,
                'severity': severity,
                'details': details or {}
            }
        )
    
    def log_pii_detection(
        self,
        user_id: str,
        request_id: str,
        entity_types: list,
        action: str
    ):
        """Log PII detection event"""
        self.logger.info(
            'pii_detection',
            extra={
                'user_id': user_id,
                'request_id': request_id,
                'entity_types': entity_types,
                'action': action
            }
        )
    
    def log_rate_limit_exceeded(
        self,
        user_id: str,
        endpoint: str,
        limit_type: str
    ):
        """Log rate limit exceeded event"""
        self.logger.warning(
            'rate_limit_exceeded',
            extra={
                'user_id': user_id,
                'endpoint': endpoint,
                'limit_type': limit_type
            }
        )


# Global audit logger instance
audit_logger = AuditLogger()
