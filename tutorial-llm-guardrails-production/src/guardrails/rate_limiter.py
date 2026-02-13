"""
Rate Limiting using Redis

Implements sliding window rate limiting at per-minute and per-hour granularities.

NOTE: This is a simplified version for the tutorial structure.
Full Redis implementation available in the complete tutorial.
"""

from typing import Dict, Tuple
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiting service.
    
    In production, this uses Redis for distributed rate limiting.
    This is a placeholder showing the interface.
    """
    
    def __init__(self):
        """Initialize rate limiter"""
        self.minute_limit = 60
        self.hour_limit = 1000
        self.requests = {}  # In-memory storage for demo
        logger.info("RateLimiter initialized (placeholder - using in-memory storage)")
    
    async def initialize(self):
        """Initialize Redis connection"""
        # Placeholder - would connect to Redis in production
        pass
    
    async def check_rate_limit(
        self,
        user_id: str,
        endpoint: str = "default"
    ) -> Tuple[bool, Dict]:
        """
        Check if user has exceeded rate limits.
        
        Args:
            user_id: Unique user identifier
            endpoint: API endpoint for granular limits
            
        Returns:
            Tuple of (is_allowed, limit_info)
        """
        # Simple in-memory rate limiting for demo
        now = datetime.utcnow()
        key = f"{user_id}:{endpoint}"
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Clean old requests (older than 1 hour)
        self.requests[key] = [
            ts for ts in self.requests[key]
            if (now - ts).total_seconds() < 3600
        ]
        
        # Add current request
        self.requests[key].append(now)
        
        # Count requests in last minute and hour
        minute_count = sum(
            1 for ts in self.requests[key]
            if (now - ts).total_seconds() < 60
        )
        hour_count = len(self.requests[key])
        
        is_allowed = (
            minute_count <= self.minute_limit and
            hour_count <= self.hour_limit
        )
        
        limit_info = {
            'minute_count': minute_count,
            'minute_limit': self.minute_limit,
            'minute_remaining': max(0, self.minute_limit - minute_count),
            'hour_count': hour_count,
            'hour_limit': self.hour_limit,
            'hour_remaining': max(0, self.hour_limit - hour_count),
            'rate_limited': not is_allowed
        }
        
        if not is_allowed:
            logger.warning(
                f"Rate limit exceeded for user {user_id}: "
                f"minute={minute_count}/{self.minute_limit}, "
                f"hour={hour_count}/{self.hour_limit}"
            )
        
        return is_allowed, limit_info
    
    async def close(self):
        """Close Redis connection"""
        # Placeholder - would close Redis in production
        pass


# Singleton instance
_rate_limiter = None


async def get_rate_limiter() -> RateLimiter:
    """Get or create rate limiter singleton"""
    global _rate_limiter
    
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
        await _rate_limiter.initialize()
    
    return _rate_limiter
