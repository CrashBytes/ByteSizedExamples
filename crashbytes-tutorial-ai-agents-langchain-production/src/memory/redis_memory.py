"""
Redis-backed Conversation Memory

Provides fast, in-memory conversation history storage with TTL for automatic cleanup.
"""

import redis.asyncio as redis
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RedisConversationMemory:
    """
    Conversation memory using Redis for fast access.
    
    Features:
    - Fast in-memory storage for conversation history
    - Automatic TTL-based cleanup
    - Message limit enforcement
    - Async/await support for non-blocking operations
    - JSON serialization for complex message structures
    
    Use Cases:
    - Recent conversation history (last N messages)
    - Session-based chat state
    - Temporary agent context
    """
    
    def __init__(
        self,
        redis_url: str,
        ttl_seconds: int = 3600,
        max_messages: int = 20,
        key_prefix: str = "conversation"
    ):
        """
        Initialize Redis memory.
        
        Args:
            redis_url: Redis connection URL (redis://host:port/db)
            ttl_seconds: Time-to-live for conversation data (default: 1 hour)
            max_messages: Maximum messages to retain per conversation
            key_prefix: Prefix for Redis keys
        """
        self.redis_url = redis_url
        self.ttl_seconds = ttl_seconds
        self.max_messages = max_messages
        self.key_prefix = key_prefix
        self.client: Optional[redis.Redis] = None
        
        logger.info(
            "RedisConversationMemory initialized",
            extra={
                "ttl_seconds": ttl_seconds,
                "max_messages": max_messages
            }
        )
    
    async def initialize(self):
        """
        Establish Redis connection.
        
        Call this before using the memory instance.
        """
        try:
            self.client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True
            )
            
            # Test connection
            await self.client.ping()
            
            logger.info("Redis connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}", exc_info=True)
            raise
    
    def _get_key(self, conversation_id: str) -> str:
        """Generate Redis key for conversation"""
        return f"{self.key_prefix}:{conversation_id}"
    
    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None,
        tool_calls: Optional[List[Dict]] = None
    ):
        """
        Add message to conversation history.
        
        Args:
            conversation_id: Unique conversation identifier
            role: Message role (user/assistant/system/tool)
            content: Message content
            metadata: Optional metadata (user_id, session_id, etc.)
            tool_calls: Optional tool calls made by assistant
        """
        key = self._get_key(conversation_id)
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
            "tool_calls": tool_calls or []
        }
        
        try:
            # Add to list
            await self.client.rpush(key, json.dumps(message))
            
            # Trim to max messages (keep most recent)
            await self.client.ltrim(key, -self.max_messages, -1)
            
            # Set/update TTL
            await self.client.expire(key, self.ttl_seconds)
            
            logger.debug(
                "Message added to conversation",
                extra={
                    "conversation_id": conversation_id,
                    "role": role,
                    "content_length": len(content)
                }
            )
        except Exception as e:
            logger.error(
                f"Failed to add message to conversation {conversation_id}: {e}",
                exc_info=True
            )
            raise
    
    async def get_history(
        self,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve conversation history.
        
        Args:
            conversation_id: Conversation identifier
            limit: Optional limit on number of messages (most recent)
            
        Returns:
            List of messages in chronological order
        """
        key = self._get_key(conversation_id)
        
        try:
            # Get all messages
            messages_json = await self.client.lrange(key, 0, -1)
            
            if not messages_json:
                logger.debug(f"No history found for conversation {conversation_id}")
                return []
            
            # Parse messages
            messages = [json.loads(msg) for msg in messages_json]
            
            # Apply limit if specified (keep most recent)
            if limit and limit < len(messages):
                messages = messages[-limit:]
            
            logger.debug(
                "Retrieved conversation history",
                extra={
                    "conversation_id": conversation_id,
                    "message_count": len(messages)
                }
            )
            
            return messages
        except Exception as e:
            logger.error(
                f"Failed to get history for conversation {conversation_id}: {e}",
                exc_info=True
            )
            return []
    
    async def get_last_message(
        self,
        conversation_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the most recent message in a conversation.
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Most recent message dict or None
        """
        key = self._get_key(conversation_id)
        
        try:
            message_json = await self.client.lindex(key, -1)
            if message_json:
                return json.loads(message_json)
            return None
        except Exception as e:
            logger.error(f"Failed to get last message: {e}", exc_info=True)
            return None
    
    async def clear_history(self, conversation_id: str):
        """
        Clear conversation history.
        
        Args:
            conversation_id: Conversation identifier
        """
        key = self._get_key(conversation_id)
        
        try:
            await self.client.delete(key)
            logger.info(f"Cleared conversation history for {conversation_id}")
        except Exception as e:
            logger.error(
                f"Failed to clear conversation {conversation_id}: {e}",
                exc_info=True
            )
            raise
    
    async def get_conversation_age(
        self,
        conversation_id: str
    ) -> Optional[float]:
        """
        Get age of conversation in seconds.
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Age in seconds or None if conversation doesn't exist
        """
        key = self._get_key(conversation_id)
        
        try:
            ttl = await self.client.ttl(key)
            if ttl < 0:
                return None
            
            # Calculate age from TTL
            age = self.ttl_seconds - ttl
            return float(age)
        except Exception as e:
            logger.error(f"Failed to get conversation age: {e}")
            return None
    
    async def extend_ttl(
        self,
        conversation_id: str,
        additional_seconds: Optional[int] = None
    ):
        """
        Extend TTL for a conversation.
        
        Args:
            conversation_id: Conversation identifier
            additional_seconds: Additional seconds to add (default: reset to full TTL)
        """
        key = self._get_key(conversation_id)
        
        try:
            new_ttl = additional_seconds if additional_seconds else self.ttl_seconds
            await self.client.expire(key, new_ttl)
            logger.debug(f"Extended TTL for conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Failed to extend TTL: {e}", exc_info=True)
    
    async def get_active_conversations(
        self,
        pattern: str = "*"
    ) -> List[str]:
        """
        Get list of active conversation IDs.
        
        Args:
            pattern: Optional pattern for filtering conversations
            
        Returns:
            List of conversation IDs
        """
        try:
            key_pattern = f"{self.key_prefix}:{pattern}"
            keys = []
            
            async for key in self.client.scan_iter(match=key_pattern):
                # Extract conversation ID from key
                conv_id = key.replace(f"{self.key_prefix}:", "")
                keys.append(conv_id)
            
            logger.debug(f"Found {len(keys)} active conversations")
            return keys
        except Exception as e:
            logger.error(f"Failed to get active conversations: {e}", exc_info=True)
            return []
    
    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")


# Example usage and testing
if __name__ == "__main__":
    import asyncio
    
    async def test_memory():
        # Initialize memory
        memory = RedisConversationMemory(
            redis_url="redis://localhost:6379/0",
            ttl_seconds=3600,
            max_messages=10
        )
        
        await memory.initialize()
        
        try:
            # Test conversation ID
            conv_id = "test-conversation-123"
            
            # Add some messages
            await memory.add_message(
                conv_id,
                "user",
                "Hello, how are you?",
                metadata={"user_id": "user-456"}
            )
            
            await memory.add_message(
                conv_id,
                "assistant",
                "I'm doing well, thank you!",
                metadata={"model": "gpt-4"}
            )
            
            await memory.add_message(
                conv_id,
                "user",
                "What's the weather like?",
                metadata={"user_id": "user-456"}
            )
            
            # Get history
            history = await memory.get_history(conv_id)
            print(f"\nConversation History ({len(history)} messages):")
            for msg in history:
                print(f"- [{msg['role']}] {msg['content']}")
            
            # Get last message
            last_msg = await memory.get_last_message(conv_id)
            print(f"\nLast Message: [{last_msg['role']}] {last_msg['content']}")
            
            # Get conversation age
            age = await memory.get_conversation_age(conv_id)
            print(f"\nConversation Age: {age:.2f} seconds")
            
            # Get active conversations
            active = await memory.get_active_conversations()
            print(f"\nActive Conversations: {active}")
            
            # Clear history
            await memory.clear_history(conv_id)
            print(f"\nCleared conversation {conv_id}")
            
            # Verify cleared
            history_after = await memory.get_history(conv_id)
            print(f"Messages after clear: {len(history_after)}")
            
        finally:
            await memory.close()
    
    asyncio.run(test_memory())
