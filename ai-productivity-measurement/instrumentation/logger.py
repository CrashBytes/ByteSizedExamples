"""
Instrumentation Layer: Productivity Logger

Captures AI interactions without disrupting workflows.
Implements async logging with buffering and fault tolerance.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, Any, List
import psycopg2
from psycopg2.extras import Json


@dataclass
class AIInteraction:
    """Represents a single AI tool interaction"""
    
    tool_name: str
    task_type: str
    user_id: str
    input_tokens: int
    output_tokens: int
    duration_ms: int
    model_name: str
    completion_status: str
    interaction_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    tool_version: Optional[str] = None
    session_id: Optional[str] = None
    quality_score: Optional[float] = None
    user_satisfaction: Optional[str] = None
    cost_usd: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.interaction_id is None:
            self.interaction_id = str(uuid.uuid4())
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def validate(self) -> bool:
        """Validate interaction data"""
        if not self.tool_name or not self.task_type or not self.user_id:
            return False
        if self.input_tokens < 0 or self.output_tokens < 0:
            return False
        if self.duration_ms < 0:
            return False
        if self.completion_status not in ['success', 'error', 'timeout', 'abandoned']:
            return False
        if self.quality_score is not None and not (0 <= self.quality_score <= 1):
            return False
        return True


class ProductivityLogger:
    """
    Asynchronous productivity logger with buffering and fault tolerance.
    
    Logs AI interactions to database without disrupting user workflows.
    Implements buffering to batch database writes for performance.
    """
    
    def __init__(
        self, 
        connection_string: str, 
        buffer_size: int = 100,
        flush_interval: int = 60
    ):
        """
        Initialize the productivity logger.
        
        Args:
            connection_string: PostgreSQL connection string
            buffer_size: Number of interactions to buffer before flushing
            flush_interval: Maximum seconds between flushes
        """
        self.connection_string = connection_string
        self.buffer: List[AIInteraction] = []
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        self.logger = logging.getLogger(__name__)
        self.last_flush = datetime.utcnow()
        self._flush_lock = asyncio.Lock()
        
    async def log_interaction(self, interaction: AIInteraction) -> bool:
        """
        Log an AI interaction asynchronously.
        
        Args:
            interaction: The AIInteraction to log
            
        Returns:
            bool: True if logged successfully (or buffered), False otherwise
        """
        try:
            # Validate interaction data
            if not interaction.validate():
                self.logger.error(f"Invalid interaction data: {interaction}")
                return False
            
            self.buffer.append(interaction)
            
            # Flush if buffer is full or time interval exceeded
            should_flush = (
                len(self.buffer) >= self.buffer_size or
                (datetime.utcnow() - self.last_flush).total_seconds() > self.flush_interval
            )
            
            if should_flush:
                await self.flush()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to log interaction: {e}")
            # Don't raise - logging failures shouldn't break workflows
            return False
    
    async def flush(self) -> bool:
        """
        Flush buffered interactions to database.
        
        Returns:
            bool: True if flushed successfully, False otherwise
        """
        if not self.buffer:
            return True
        
        async with self._flush_lock:
            try:
                conn = psycopg2.connect(self.connection_string)
                cursor = conn.cursor()
                
                for interaction in self.buffer:
                    cursor.execute("""
                        INSERT INTO ai_interactions (
                            interaction_id, timestamp, user_id, tool_name, tool_version,
                            task_type, session_id, input_tokens, output_tokens, duration_ms,
                            model_name, completion_status, quality_score, user_satisfaction,
                            cost_usd, metadata
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        interaction.interaction_id,
                        interaction.timestamp,
                        interaction.user_id,
                        interaction.tool_name,
                        interaction.tool_version,
                        interaction.task_type,
                        interaction.session_id,
                        interaction.input_tokens,
                        interaction.output_tokens,
                        interaction.duration_ms,
                        interaction.model_name,
                        interaction.completion_status,
                        interaction.quality_score,
                        interaction.user_satisfaction,
                        interaction.cost_usd,
                        Json(interaction.metadata) if interaction.metadata else None
                    ))
                
                conn.commit()
                cursor.close()
                conn.close()
                
                logged_count = len(self.buffer)
                self.buffer.clear()
                self.last_flush = datetime.utcnow()
                
                self.logger.info(f"Flushed {logged_count} interactions to database")
                return True
                
            except Exception as e:
                self.logger.error(f"Failed to flush interactions: {e}")
                return False
    
    async def shutdown(self):
        """Flush remaining buffer and cleanup on shutdown"""
        await self.flush()


# Convenience function for quick setup
def create_logger(connection_string: str, **kwargs) -> ProductivityLogger:
    """
    Create and configure a ProductivityLogger instance.
    
    Args:
        connection_string: PostgreSQL connection string
        **kwargs: Additional arguments passed to ProductivityLogger
        
    Returns:
        ProductivityLogger: Configured logger instance
    """
    return ProductivityLogger(connection_string, **kwargs)
