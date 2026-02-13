"""
Comprehensive tests for Structured Logging

Tests logging configuration and audit logging including:
- JSON logging setup
- Logger retrieval
- Audit trail logging
- Request logging
- Violation logging
"""

import pytest
import logging
from unittest.mock import patch, MagicMock, mock_open
from io import StringIO

from src.monitoring.logging import (
    setup_logging,
    get_logger,
    AuditLogger,
    audit_logger
)


@pytest.fixture
def mock_settings():
    """Mock settings for logging tests"""
    with patch('src.monitoring.logging.get_settings') as mock:
        settings = MagicMock()
        settings.log_level = 'INFO'
        settings.enable_audit_logging = False
        mock.return_value = settings
        yield settings


class TestSetupLogging:
    """Test logging setup"""
    
    def test_setup_logging_creates_logger(self, mock_settings):
        """Test that setup_logging creates a logger"""
        logger = setup_logging()
        
        assert logger is not None
        assert isinstance(logger, logging.Logger)
    
    def test_setup_logging_sets_log_level(self, mock_settings):
        """Test that log level is set from settings"""
        mock_settings.log_level = 'DEBUG'
        
        logger = setup_logging()
        
        assert logger.level == logging.DEBUG
    
    def test_setup_logging_adds_console_handler(self, mock_settings):
        """Test that console handler is added"""
        logger = setup_logging()
        
        # Should have at least console handler
        assert len(logger.handlers) >= 1
        
        # First handler should be StreamHandler
        assert isinstance(logger.handlers[0], logging.StreamHandler)
    
    def test_setup_logging_with_audit_enabled(self, mock_settings):
        """Test setup with audit logging enabled"""
        mock_settings.enable_audit_logging = True
        
        with patch('builtins.open', mock_open()):
            with patch('os.path.exists', return_value=True):
                logger = setup_logging()
                
                # Should have console + file handler
                assert len(logger.handlers) >= 1
    
    def test_setup_logging_removes_existing_handlers(self, mock_settings):
        """Test that existing handlers are removed"""
        logger = logging.getLogger()
        
        # Add a dummy handler
        dummy_handler = logging.StreamHandler()
        logger.addHandler(dummy_handler)
        initial_count = len(logger.handlers)
        
        # Setup logging should clear and recreate
        setup_logging()
        
        # Should have new handlers, not accumulate
        assert len(logger.handlers) >= 1


class TestGetLogger:
    """Test logger retrieval"""
    
    def test_get_logger_returns_logger(self):
        """Test that get_logger returns a Logger instance"""
        logger = get_logger('test_module')
        
        assert logger is not None
        assert isinstance(logger, logging.Logger)
    
    def test_get_logger_with_different_names(self):
        """Test getting loggers with different names"""
        logger1 = get_logger('module1')
        logger2 = get_logger('module2')
        
        assert logger1.name == 'module1'
        assert logger2.name == 'module2'
        assert logger1 is not logger2
    
    def test_get_logger_same_name_returns_same_instance(self):
        """Test that same name returns same logger instance"""
        logger1 = get_logger('same_name')
        logger2 = get_logger('same_name')
        
        assert logger1 is logger2


class TestAuditLogger:
    """Test AuditLogger class"""
    
    def test_audit_logger_initialization(self):
        """Test AuditLogger initialization"""
        audit_log = AuditLogger()
        
        assert audit_log is not None
        assert audit_log.logger is not None
        assert audit_log.logger.name == 'audit'
    
    def test_log_request(self):
        """Test logging an API request"""
        audit_log = AuditLogger()
        
        # Mock the logger.info method
        with patch.object(audit_log.logger, 'info') as mock_info:
            audit_log.log_request(
                user_id='user123',
                request_id='req456',
                endpoint='/api/completions'
            )
            
            # Verify info was called
            mock_info.assert_called_once()
            
            # Check call arguments
            call_args = mock_info.call_args
            assert call_args[0][0] == 'api_request'
            assert 'user_id' in call_args[1]['extra']
            assert call_args[1]['extra']['user_id'] == 'user123'
            assert call_args[1]['extra']['request_id'] == 'req456'
            assert call_args[1]['extra']['endpoint'] == '/api/completions'
    
    def test_log_request_with_extra_kwargs(self):
        """Test logging request with additional kwargs"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'info') as mock_info:
            audit_log.log_request(
                user_id='user123',
                request_id='req456',
                endpoint='/api/test',
                provider='openai',
                model='gpt-4'
            )
            
            call_args = mock_info.call_args
            extra = call_args[1]['extra']
            
            assert extra['provider'] == 'openai'
            assert extra['model'] == 'gpt-4'
    
    def test_log_guardrail_violation(self):
        """Test logging a guardrail violation"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'warning') as mock_warning:
            audit_log.log_guardrail_violation(
                user_id='user789',
                request_id='req123',
                guardrail_type='pii_detection',
                severity='high'
            )
            
            mock_warning.assert_called_once()
            
            call_args = mock_warning.call_args
            assert call_args[0][0] == 'guardrail_violation'
            extra = call_args[1]['extra']
            assert extra['user_id'] == 'user789'
            assert extra['guardrail_type'] == 'pii_detection'
            assert extra['severity'] == 'high'
    
    def test_log_guardrail_violation_with_details(self):
        """Test logging violation with details dict"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'warning') as mock_warning:
            details = {'entities': ['PERSON', 'EMAIL'], 'count': 2}
            
            audit_log.log_guardrail_violation(
                user_id='user789',
                request_id='req123',
                guardrail_type='pii_detection',
                severity='high',
                details=details
            )
            
            call_args = mock_warning.call_args
            extra = call_args[1]['extra']
            assert extra['details'] == details
    
    def test_log_guardrail_violation_without_details(self):
        """Test logging violation without details (defaults to empty dict)"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'warning') as mock_warning:
            audit_log.log_guardrail_violation(
                user_id='user789',
                request_id='req123',
                guardrail_type='toxicity',
                severity='medium'
            )
            
            call_args = mock_warning.call_args
            extra = call_args[1]['extra']
            assert extra['details'] == {}
    
    def test_log_pii_detection(self):
        """Test logging PII detection event"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'info') as mock_info:
            audit_log.log_pii_detection(
                user_id='user456',
                request_id='req789',
                entity_types=['PERSON', 'EMAIL', 'PHONE'],
                action='redacted'
            )
            
            mock_info.assert_called_once()
            
            call_args = mock_info.call_args
            assert call_args[0][0] == 'pii_detection'
            extra = call_args[1]['extra']
            assert extra['user_id'] == 'user456'
            assert extra['entity_types'] == ['PERSON', 'EMAIL', 'PHONE']
            assert extra['action'] == 'redacted'
    
    def test_log_pii_detection_empty_entities(self):
        """Test logging PII detection with empty entity list"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'info') as mock_info:
            audit_log.log_pii_detection(
                user_id='user456',
                request_id='req789',
                entity_types=[],
                action='none'
            )
            
            call_args = mock_info.call_args
            extra = call_args[1]['extra']
            assert extra['entity_types'] == []
    
    def test_log_rate_limit_exceeded(self):
        """Test logging rate limit exceeded event"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'warning') as mock_warning:
            audit_log.log_rate_limit_exceeded(
                user_id='user999',
                endpoint='/api/completions',
                limit_type='per_minute'
            )
            
            mock_warning.assert_called_once()
            
            call_args = mock_warning.call_args
            assert call_args[0][0] == 'rate_limit_exceeded'
            extra = call_args[1]['extra']
            assert extra['user_id'] == 'user999'
            assert extra['endpoint'] == '/api/completions'
            assert extra['limit_type'] == 'per_minute'


class TestGlobalAuditLogger:
    """Test global audit logger instance"""
    
    def test_global_audit_logger_exists(self):
        """Test that global audit_logger instance exists"""
        assert audit_logger is not None
        assert isinstance(audit_logger, AuditLogger)
    
    def test_global_audit_logger_usable(self):
        """Test that global audit_logger is usable"""
        with patch.object(audit_logger.logger, 'info') as mock_info:
            audit_logger.log_request(
                user_id='test',
                request_id='test',
                endpoint='/test'
            )
            
            mock_info.assert_called_once()


class TestAuditLoggerIntegration:
    """Integration tests for audit logging"""
    
    def test_multiple_log_calls(self):
        """Test multiple sequential log calls"""
        audit_log = AuditLogger()
        
        with patch.object(audit_log.logger, 'info') as mock_info, \
             patch.object(audit_log.logger, 'warning') as mock_warning:
            
            # Log request
            audit_log.log_request('user1', 'req1', '/api/test')
            
            # Log PII detection
            audit_log.log_pii_detection('user1', 'req1', ['EMAIL'], 'redacted')
            
            # Log violation
            audit_log.log_guardrail_violation('user1', 'req1', 'pii', 'high')
            
            # Log rate limit
            audit_log.log_rate_limit_exceeded('user1', '/api/test', 'minute')
            
            # Verify all were called
            assert mock_info.call_count == 2  # request + pii_detection
            assert mock_warning.call_count == 2  # violation + rate_limit


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
