#!/usr/bin/env python3
"""
Initialize PostgreSQL Database

Creates necessary tables and schemas for the AI agent system.
"""

import asyncio
import asyncpg
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.agents.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# SQL for creating tables
CREATE_TABLES_SQL = """
-- Conversation history table
CREATE TABLE IF NOT EXISTS conversation_history (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tool_calls JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at)
);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS agent_executions (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255),
    query TEXT NOT NULL,
    response TEXT,
    tools_used JSONB DEFAULT '[]',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms FLOAT,
    model VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success)
);

-- Tool execution logs
CREATE TABLE IF NOT EXISTS tool_executions (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    input_params JSONB,
    output_result JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tool_name (tool_name),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success)
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    conversation_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_started_at (started_at)
);

-- System metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    labels JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_recorded_at (recorded_at)
);
"""


async def create_database_if_not_exists(settings):
    """Create database if it doesn't exist"""
    try:
        # Connect to postgres database
        conn = await asyncpg.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            user=settings.postgres_user,
            password=settings.postgres_password,
            database='postgres'
        )
        
        # Check if database exists
        db_exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            settings.postgres_db
        )
        
        if not db_exists:
            logger.info(f"Creating database: {settings.postgres_db}")
            await conn.execute(f'CREATE DATABASE {settings.postgres_db}')
            logger.info(f"Database created: {settings.postgres_db}")
        else:
            logger.info(f"Database already exists: {settings.postgres_db}")
        
        await conn.close()
    
    except Exception as e:
        logger.error(f"Failed to create database: {e}", exc_info=True)
        raise


async def initialize_tables(settings):
    """Initialize database tables"""
    try:
        # Connect to target database
        conn = await asyncpg.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            user=settings.postgres_user,
            password=settings.postgres_password,
            database=settings.postgres_db
        )
        
        logger.info("Creating tables...")
        
        # Execute table creation SQL
        await conn.execute(CREATE_TABLES_SQL)
        
        logger.info("Tables created successfully")
        
        # Verify tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        logger.info(f"Found {len(tables)} tables:")
        for table in tables:
            logger.info(f"  - {table['table_name']}")
        
        await conn.close()
        
        return True
    
    except Exception as e:
        logger.error(f"Failed to initialize tables: {e}", exc_info=True)
        return False


async def test_connection(settings):
    """Test database connection"""
    try:
        conn = await asyncpg.connect(
            host=settings.postgres_host,
            port=settings.postgres_port,
            user=settings.postgres_user,
            password=settings.postgres_password,
            database=settings.postgres_db
        )
        
        # Test query
        version = await conn.fetchval('SELECT version()')
        logger.info(f"PostgreSQL version: {version}")
        
        await conn.close()
        
        return True
    
    except Exception as e:
        logger.error(f"Connection test failed: {e}", exc_info=True)
        return False


async def main():
    """Main initialization function"""
    logger.info("=== PostgreSQL Database Initialization ===")
    
    # Load settings
    settings = get_settings()
    
    logger.info(f"Host: {settings.postgres_host}")
    logger.info(f"Port: {settings.postgres_port}")
    logger.info(f"Database: {settings.postgres_db}")
    logger.info(f"User: {settings.postgres_user}")
    
    try:
        # Create database if needed
        await create_database_if_not_exists(settings)
        
        # Test connection
        if not await test_connection(settings):
            logger.error("Database connection test failed")
            return False
        
        # Initialize tables
        if not await initialize_tables(settings):
            logger.error("Table initialization failed")
            return False
        
        logger.info("=== Database initialization completed successfully ===")
        return True
    
    except Exception as e:
        logger.error(f"Initialization failed: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
