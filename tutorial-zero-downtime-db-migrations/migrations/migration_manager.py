"""
Database Migration Manager
Handles versioned migrations with rollback support.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/
"""

import psycopg2
from typing import List, Dict, Optional, Tuple
import logging
from pathlib import Path
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)


class MigrationManager:
    """
    Manages database schema migrations with version tracking.
    
    Features:
    - Versioned migrations
    - Automatic rollback on failure
    - Checksum validation
    - Migration history tracking
    """
    
    def __init__(self, connection_string: str):
        """
        Initialize migration manager.
        
        Args:
            connection_string: PostgreSQL connection string
                              (e.g., "postgresql://user:pass@localhost:5432/db")
        """
        self.conn_string = connection_string
        self.conn = None
        
    def initialize_schema_version_table(self) -> None:
        """
        Create schema_version table if not exists.
        
        This table tracks all applied migrations with:
        - version: Migration version number
        - description: Human-readable description
        - applied_at: Timestamp of application
        - checksum: MD5 hash of migration SQL
        """
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS schema_version (
                        version INTEGER PRIMARY KEY,
                        description TEXT NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        checksum TEXT NOT NULL,
                        execution_time_ms INTEGER,
                        applied_by TEXT DEFAULT CURRENT_USER
                    )
                """)
                conn.commit()
                logger.info("Schema version table initialized")
    
    def get_current_version(self) -> int:
        """
        Get current schema version.
        
        Returns:
            Current version number (0 if no migrations applied)
        """
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COALESCE(MAX(version), 0) FROM schema_version"
                )
                version = cur.fetchone()[0]
                logger.info(f"Current schema version: {version}")
                return version
    
    def get_migration_history(self) -> List[Dict]:
        """
        Get complete migration history.
        
        Returns:
            List of migration records with all metadata
        """
        with psycopg2.connect(self.conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT version, description, applied_at, 
                           checksum, execution_time_ms, applied_by
                    FROM schema_version
                    ORDER BY version
                """)
                rows = cur.fetchall()
                return [
                    {
                        "version": row[0],
                        "description": row[1],
                        "applied_at": row[2],
                        "checksum": row[3],
                        "execution_time_ms": row[4],
                        "applied_by": row[5]
                    }
                    for row in rows
                ]
    
    def apply_migration(
        self,
        version: int,
        description: str,
        up_sql: str,
        down_sql: str
    ) -> bool:
        """
        Apply migration with automatic rollback on failure.
        
        Args:
            version: Migration version number
            description: Migration description
            up_sql: Forward migration SQL
            down_sql: Rollback migration SQL
        
        Returns:
            True if successful, False otherwise
        """
        start_time = datetime.now()
        
        # Check if migration already applied
        current_version = self.get_current_version()
        if version <= current_version:
            logger.warning(
                f"Migration {version} already applied (current: {current_version})"
            )
            return False
        
        try:
            with psycopg2.connect(self.conn_string) as conn:
                with conn.cursor() as cur:
                    # Execute migration
                    logger.info(f"Applying migration {version}: {description}")
                    cur.execute(up_sql)
                    
                    # Calculate execution time
                    execution_time = int(
                        (datetime.now() - start_time).total_seconds() * 1000
                    )
                    
                    # Record version
                    checksum = hashlib.md5(up_sql.encode()).hexdigest()
                    cur.execute("""
                        INSERT INTO schema_version 
                        (version, description, checksum, execution_time_ms)
                        VALUES (%s, %s, %s, %s)
                    """, (version, description, checksum, execution_time))
                    
                    conn.commit()
                    logger.info(
                        f"Migration {version} applied successfully "
                        f"({execution_time}ms)"
                    )
                    return True
                    
        except Exception as e:
            logger.error(f"Migration {version} failed: {str(e)}")
            logger.info(f"Rolling back migration {version}")
            
            try:
                with psycopg2.connect(self.conn_string) as conn:
                    with conn.cursor() as cur:
                        cur.execute(down_sql)
                        conn.commit()
                        logger.info(
                            f"Rollback of migration {version} successful"
                        )
            except Exception as rollback_error:
                logger.error(
                    f"Rollback failed: {str(rollback_error)}"
                )
                raise rollback_error
            
            return False
    
    def rollback_migration(self, version: int, down_sql: str) -> bool:
        """
        Manually rollback a specific migration.
        
        Args:
            version: Migration version to rollback
            down_sql: Rollback SQL
        
        Returns:
            True if successful, False otherwise
        """
        current_version = self.get_current_version()
        
        if version > current_version:
            logger.error(
                f"Cannot rollback migration {version}: "
                f"not yet applied (current: {current_version})"
            )
            return False
        
        try:
            with psycopg2.connect(self.conn_string) as conn:
                with conn.cursor() as cur:
                    logger.info(f"Rolling back migration {version}")
                    
                    # Execute rollback
                    cur.execute(down_sql)
                    
                    # Remove from version history
                    cur.execute(
                        "DELETE FROM schema_version WHERE version = %s",
                        (version,)
                    )
                    
                    conn.commit()
                    logger.info(f"Migration {version} rolled back successfully")
                    return True
                    
        except Exception as e:
            logger.error(f"Rollback of migration {version} failed: {str(e)}")
            return False
    
    def validate_migration_integrity(self) -> Tuple[bool, List[str]]:
        """
        Validate migration history integrity.
        
        Checks:
        - Sequential version numbers
        - No gaps in version sequence
        
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        history = self.get_migration_history()
        issues = []
        
        if not history:
            return True, issues
        
        # Check sequential versions
        expected_version = 1
        for migration in history:
            if migration["version"] != expected_version:
                issues.append(
                    f"Gap in migration sequence: expected {expected_version}, "
                    f"found {migration['version']}"
                )
            expected_version = migration["version"] + 1
        
        is_valid = len(issues) == 0
        
        if is_valid:
            logger.info("Migration integrity check passed")
        else:
            logger.warning(f"Migration integrity issues found: {issues}")
        
        return is_valid, issues


class MigrationScript:
    """
    Represents a single migration script.
    
    Use this class to define migrations in a structured way.
    """
    
    def __init__(
        self,
        version: int,
        description: str,
        up_sql: str,
        down_sql: str
    ):
        self.version = version
        self.description = description
        self.up_sql = up_sql
        self.down_sql = down_sql
    
    def apply(self, manager: MigrationManager) -> bool:
        """Apply this migration using the given manager."""
        return manager.apply_migration(
            self.version,
            self.description,
            self.up_sql,
            self.down_sql
        )
    
    def rollback(self, manager: MigrationManager) -> bool:
        """Rollback this migration using the given manager."""
        return manager.rollback_migration(self.version, self.down_sql)
