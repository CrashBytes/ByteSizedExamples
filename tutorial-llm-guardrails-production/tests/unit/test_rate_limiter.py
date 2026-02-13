"""
Comprehensive tests for Rate Limiter

Tests rate limiting including:
- Per-minute rate limits
- Per-hour rate limits
- Rate limit info and counters
- Multiple users and endpoints
- Edge cases
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from src.guardrails.rate_limiter import RateLimiter, get_rate_limiter


class TestRateLimiter:
    """Test rate limiter functionality"""
    
    @pytest.mark.asyncio
    async def test_initialization(self):
        """Test rate limiter initialization"""
        limiter = RateLimiter()
        
        assert limiter is not None
        assert limiter.minute_limit == 60
        assert limiter.hour_limit == 1000
        assert isinstance(limiter.requests, dict)
    
    @pytest.mark.asyncio
    async def test_initialize_method(self):
        """Test initialize method"""
        limiter = RateLimiter()
        await limiter.initialize()
        
        # Should complete without error
        assert True
    
    @pytest.mark.asyncio
    async def test_first_request_allowed(self):
        """Test that first request is always allowed"""
        limiter = RateLimiter()
        
        is_allowed, info = await limiter.check_rate_limit("user1", "test_endpoint")
        
        assert is_allowed is True
        assert info['minute_count'] == 1
        assert info['hour_count'] == 1
        assert info['rate_limited'] is False
    
    @pytest.mark.asyncio
    async def test_multiple_requests_under_limit(self):
        """Test multiple requests under rate limit"""
        limiter = RateLimiter()
        user_id = "user2"
        
        # Make 10 requests
        for i in range(10):
            is_allowed, info = await limiter.check_rate_limit(user_id)
            assert is_allowed is True
            assert info['minute_count'] == i + 1
            assert info['hour_count'] == i + 1
    
    @pytest.mark.asyncio
    async def test_minute_limit_exceeded(self):
        """Test exceeding per-minute rate limit"""
        limiter = RateLimiter()
        limiter.minute_limit = 5  # Set low limit for testing
        user_id = "user3"
        
        # Make requests up to limit
        for i in range(5):
            is_allowed, info = await limiter.check_rate_limit(user_id)
            assert is_allowed is True
        
        # Next request should be rate limited
        is_allowed, info = await limiter.check_rate_limit(user_id)
        
        assert is_allowed is False
        assert info['rate_limited'] is True
        assert info['minute_remaining'] == 0
    
    @pytest.mark.asyncio
    async def test_hour_limit_exceeded(self):
        """Test exceeding per-hour rate limit"""
        limiter = RateLimiter()
        limiter.hour_limit = 10  # Set low limit for testing
        limiter.minute_limit = 100  # High minute limit
        user_id = "user4"
        
        # Make requests up to hour limit
        for i in range(10):
            is_allowed, info = await limiter.check_rate_limit(user_id)
            assert is_allowed is True
        
        # Next request should be rate limited
        is_allowed, info = await limiter.check_rate_limit(user_id)
        
        assert is_allowed is False
        assert info['rate_limited'] is True
        assert info['hour_remaining'] == 0
    
    @pytest.mark.asyncio
    async def test_different_users_independent(self):
        """Test that different users have independent rate limits"""
        limiter = RateLimiter()
        
        # User 1 makes requests
        for i in range(5):
            await limiter.check_rate_limit("user5")
        
        # User 2 should start fresh
        is_allowed, info = await limiter.check_rate_limit("user6")
        
        assert is_allowed is True
        assert info['minute_count'] == 1
        assert info['hour_count'] == 1
    
    @pytest.mark.asyncio
    async def test_different_endpoints_independent(self):
        """Test that different endpoints have independent rate limits"""
        limiter = RateLimiter()
        user_id = "user7"
        
        # Make requests to endpoint1
        for i in range(5):
            await limiter.check_rate_limit(user_id, "endpoint1")
        
        # endpoint2 should start fresh
        is_allowed, info = await limiter.check_rate_limit(user_id, "endpoint2")
        
        assert is_allowed is True
        assert info['minute_count'] == 1
        assert info['hour_count'] == 1
    
    @pytest.mark.asyncio
    async def test_limit_info_structure(self):
        """Test that limit info contains all required fields"""
        limiter = RateLimiter()
        
        is_allowed, info = await limiter.check_rate_limit("user8")
        
        assert 'minute_count' in info
        assert 'minute_limit' in info
        assert 'minute_remaining' in info
        assert 'hour_count' in info
        assert 'hour_limit' in info
        assert 'hour_remaining' in info
        assert 'rate_limited' in info
    
    @pytest.mark.asyncio
    async def test_remaining_counts_decrement(self):
        """Test that remaining counts decrement correctly"""
        limiter = RateLimiter()
        limiter.minute_limit = 10
        user_id = "user9"
        
        # First request
        _, info1 = await limiter.check_rate_limit(user_id)
        assert info1['minute_remaining'] == 9
        
        # Second request
        _, info2 = await limiter.check_rate_limit(user_id)
        assert info2['minute_remaining'] == 8
        
        # Third request
        _, info3 = await limiter.check_rate_limit(user_id)
        assert info3['minute_remaining'] == 7
    
    @pytest.mark.asyncio
    async def test_close_method(self):
        """Test close method"""
        limiter = RateLimiter()
        await limiter.close()
        
        # Should complete without error
        assert True
    
    @pytest.mark.asyncio
    async def test_get_rate_limiter_singleton(self):
        """Test get_rate_limiter returns singleton instance"""
        limiter1 = await get_rate_limiter()
        limiter2 = await get_rate_limiter()
        
        # Should return same instance
        assert limiter1 is limiter2
        assert isinstance(limiter1, RateLimiter)


class TestRateLimiterEdgeCases:
    """Test edge cases for rate limiter"""
    
    @pytest.mark.asyncio
    async def test_empty_user_id(self):
        """Test with empty user ID"""
        limiter = RateLimiter()
        
        is_allowed, info = await limiter.check_rate_limit("")
        
        assert is_allowed is True
        assert isinstance(info, dict)
    
    @pytest.mark.asyncio
    async def test_very_long_user_id(self):
        """Test with very long user ID"""
        limiter = RateLimiter()
        long_id = "user" * 1000
        
        is_allowed, info = await limiter.check_rate_limit(long_id)
        
        assert is_allowed is True
    
    @pytest.mark.asyncio
    async def test_special_characters_in_user_id(self):
        """Test user ID with special characters"""
        limiter = RateLimiter()
        
        is_allowed, info = await limiter.check_rate_limit("user@email.com")
        
        assert is_allowed is True
    
    @pytest.mark.asyncio
    async def test_concurrent_requests_same_user(self):
        """Test concurrent requests from same user"""
        limiter = RateLimiter()
        limiter.minute_limit = 20
        user_id = "concurrent_user"
        
        # Make 10 concurrent requests
        tasks = [
            limiter.check_rate_limit(user_id)
            for _ in range(10)
        ]
        results = await asyncio.gather(*tasks)
        
        # All should be allowed
        for is_allowed, info in results:
            assert is_allowed is True
    
    @pytest.mark.asyncio
    async def test_minute_count_vs_hour_count(self):
        """Test that minute and hour counts are tracked separately"""
        limiter = RateLimiter()
        user_id = "count_test_user"
        
        # Make 5 requests
        for _ in range(5):
            await limiter.check_rate_limit(user_id)
        
        _, info = await limiter.check_rate_limit(user_id)
        
        # Both should be 6 (including current request)
        assert info['minute_count'] == 6
        assert info['hour_count'] == 6
    
    @pytest.mark.asyncio
    async def test_limit_exactly_at_threshold(self):
        """Test behavior exactly at rate limit threshold"""
        limiter = RateLimiter()
        limiter.minute_limit = 3
        user_id = "threshold_user"
        
        # Make exactly 3 requests (at limit)
        for i in range(3):
            is_allowed, _ = await limiter.check_rate_limit(user_id)
            assert is_allowed is True
        
        # 4th request should fail
        is_allowed, info = await limiter.check_rate_limit(user_id)
        assert is_allowed is False
        assert info['minute_count'] == 4
    
    @pytest.mark.asyncio
    async def test_both_limits_exceeded(self):
        """Test when both minute and hour limits are exceeded"""
        limiter = RateLimiter()
        limiter.minute_limit = 2
        limiter.hour_limit = 2
        user_id = "double_limit_user"
        
        # Make 2 requests (at both limits)
        for _ in range(2):
            await limiter.check_rate_limit(user_id)
        
        # 3rd should fail both
        is_allowed, info = await limiter.check_rate_limit(user_id)
        
        assert is_allowed is False
        assert info['minute_count'] > limiter.minute_limit
        assert info['hour_count'] > limiter.hour_limit
    
    @pytest.mark.asyncio
    async def test_default_endpoint_parameter(self):
        """Test default endpoint parameter"""
        limiter = RateLimiter()
        
        # Call without endpoint (uses default)
        is_allowed1, info1 = await limiter.check_rate_limit("user_default_1")
        # Call with explicit default
        is_allowed2, info2 = await limiter.check_rate_limit("user_default_1", "default")
        
        # Second call should increment counters
        assert is_allowed1 is True
        assert is_allowed2 is True
        assert info2['minute_count'] == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
