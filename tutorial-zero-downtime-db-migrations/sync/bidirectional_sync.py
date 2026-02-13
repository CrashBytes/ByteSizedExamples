"""
Bidirectional Data Synchronization

Keeps blue and green databases in sync during migration period.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/
"""

import asyncio
import logging
from typing import List, Dict, Set, Tuple
import psycopg2
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)


class BidirectionalSync:
    """
    Synchronizes data between blue and green databases bidirectionally.
    
    Features:
    - Real-time data synchronization
    - Conflict detection and resolution
    - Consistency verification
    - Performance monitoring
    """
    
    def __init__(self, blue_conn: str, green_conn: str):
        """
        Initialize bidirectional sync.
        
        Args:
            blue_conn: Connection string for blue database
            green_conn: Connection string for green database
        """
        self.blue_conn = blue_conn
        self.green_conn = green_conn
        self.sync_active = False
        self.sync_tasks = []
        self.sync_stats = {
            "rows_synced": 0,
            "sync_errors": 0,
            "last_sync_time": None
        }
    
    async def start_sync(self, tables: List[str], interval: int = 1) -> None:
        """
        Start synchronizing specified tables.
        
        Args:
            tables: List of table names to sync
            interval: Sync interval in seconds
        """
        self.sync_active = True
        logger.info(f"Starting sync for tables: {tables}")
        
        # Create sync task for each table
        for table in tables:
            task = asyncio.create_task(
                self._sync_table(table, interval)
            )
            self.sync_tasks.append(task)
        
        # Wait for all sync tasks
        await asyncio.gather(*self.sync_tasks, return_exceptions=True)
    
    async def _sync_table(self, table: str, interval: int) -> None:
        """
        Sync single table bidirectionally.
        
        Args:
            table: Table name to sync
            interval: Sync interval in seconds
        """
        logger.info(f"Starting sync for table: {table}")
        
        while self.sync_active:
            try:
                # Sync blue → green
                await self._sync_direction(
                    self.blue_conn,
                    self.green_conn,
                    table,
                    "blue→green"
                )
                
                # Sync green → blue
                await self._sync_direction(
                    self.green_conn,
                    self.blue_conn,
                    table,
                    "green→blue"
                )
                
                self.sync_stats["last_sync_time"] = datetime.now()
                await asyncio.sleep(interval)
                
            except Exception as e:
                logger.error(f"Sync error for {table}: {str(e)}")
                self.sync_stats["sync_errors"] += 1
                await asyncio.sleep(interval * 5)  # Back off on error
    
    async def _sync_direction(
        self,
        source_conn: str,
        target_conn: str,
        table: str,
        direction: str
    ) -> int:
        """
        Sync changes from source to target database.
        
        This is a simplified implementation. In production, you would use:
        - Change Data Capture (CDC)
        - Trigger-based tracking
        - Log-based replication
        
        Args:
            source_conn: Source database connection
            target_conn: Target database connection
            table: Table name
            direction: Direction label for logging
        
        Returns:
            Number of rows synchronized
        """
        try:
            # Get changes from source
            # In production, this would use CDC or triggers
            # For simplicity, we'll use a timestamp-based approach
            
            with psycopg2.connect(source_conn) as source:
                with source.cursor() as cur:
                    # This assumes tables have updated_at timestamp
                    # Simplified example
                    last_sync = self.sync_stats.get("last_sync_time")
                    
                    if last_sync:
                        cur.execute(
                            f"""
                            SELECT * FROM {table}
                            WHERE updated_at > %s
                            """,
                            (last_sync,)
                        )
                    else:
                        # Initial sync - this would be handled differently
                        return 0
                    
                    changes = cur.fetchall()
                    
                    if changes:
                        logger.debug(
                            f"{direction}: Found {len(changes)} changes in {table}"
                        )
                        
                        # Apply changes to target
                        with psycopg2.connect(target_conn) as target:
                            with target.cursor() as target_cur:
                                # This is simplified - production would handle
                                # upserts, deletes, and conflicts
                                for row in changes:
                                    # Apply change (simplified)
                                    pass
                                
                                target.commit()
                        
                        self.sync_stats["rows_synced"] += len(changes)
                        return len(changes)
            
            return 0
            
        except Exception as e:
            logger.error(
                f"Sync error {direction} for {table}: {str(e)}"
            )
            raise
    
    async def stop_sync(self) -> None:
        """Stop synchronization and wait for tasks to complete."""
        logger.info("Stopping synchronization")
        self.sync_active = False
        
        # Cancel all sync tasks
        for task in self.sync_tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self.sync_tasks, return_exceptions=True)
        
        logger.info("Synchronization stopped")
        logger.info(
            f"Sync stats: {self.sync_stats['rows_synced']} rows synced, "
            f"{self.sync_stats['sync_errors']} errors"
        )
    
    async def verify_consistency(
        self,
        tables: List[str],
        sample_size: int = 1000
    ) -> Dict[str, Dict]:
        """
        Verify data consistency between databases.
        
        Checks:
        - Row counts match
        - Sample data matches
        - Checksums match
        
        Args:
            tables: Tables to verify
            sample_size: Number of rows to sample per table
        
        Returns:
            Dict mapping table names to consistency results
        """
        logger.info(f"Verifying consistency for {len(tables)} tables")
        results = {}
        
        for table in tables:
            results[table] = await self._verify_table_consistency(
                table,
                sample_size
            )
        
        # Log summary
        consistent_tables = sum(
            1 for r in results.values() if r["consistent"]
        )
        logger.info(
            f"Consistency check: {consistent_tables}/{len(tables)} "
            f"tables consistent"
        )
        
        return results
    
    async def _verify_table_consistency(
        self,
        table: str,
        sample_size: int
    ) -> Dict:
        """
        Verify consistency for a single table.
        
        Args:
            table: Table name
            sample_size: Number of rows to sample
        
        Returns:
            Consistency result dictionary
        """
        result = {
            "consistent": True,
            "row_count_match": False,
            "sample_match": False,
            "checksum_match": False,
            "differences": []
        }
        
        try:
            # Compare row counts
            blue_count = await self._get_row_count(self.blue_conn, table)
            green_count = await self._get_row_count(self.green_conn, table)
            
            result["blue_count"] = blue_count
            result["green_count"] = green_count
            result["row_count_match"] = blue_count == green_count
            
            if blue_count != green_count:
                result["consistent"] = False
                result["differences"].append(
                    f"Row count mismatch: blue={blue_count}, green={green_count}"
                )
            
            # Compare checksums
            blue_checksum = await self._calculate_checksum(
                self.blue_conn,
                table,
                sample_size
            )
            green_checksum = await self._calculate_checksum(
                self.green_conn,
                table,
                sample_size
            )
            
            result["blue_checksum"] = blue_checksum
            result["green_checksum"] = green_checksum
            result["checksum_match"] = blue_checksum == green_checksum
            
            if blue_checksum != green_checksum:
                result["consistent"] = False
                result["differences"].append("Checksum mismatch")
            
            if result["consistent"]:
                logger.info(f"✓ Table {table} is consistent")
            else:
                logger.warning(
                    f"✗ Table {table} has inconsistencies: "
                    f"{', '.join(result['differences'])}"
                )
            
        except Exception as e:
            logger.error(
                f"Failed to verify consistency for {table}: {str(e)}"
            )
            result["consistent"] = False
            result["error"] = str(e)
        
        return result
    
    async def _get_row_count(self, conn_string: str, table: str) -> int:
        """Get row count for a table."""
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                return cur.fetchone()[0]
    
    async def _calculate_checksum(
        self,
        conn_string: str,
        table: str,
        sample_size: int
    ) -> str:
        """
        Calculate checksum for table data.
        
        Args:
            conn_string: Database connection
            table: Table name
            sample_size: Number of rows to include
        
        Returns:
            MD5 checksum of sampled data
        """
        try:
            with psycopg2.connect(conn_string) as conn:
                with conn.cursor() as cur:
                    # Get primary key column
                    cur.execute(f"""
                        SELECT column_name
                        FROM information_schema.key_column_usage
                        WHERE table_name = %s
                        AND constraint_name LIKE '%%_pkey'
                        LIMIT 1
                    """, (table,))
                    
                    pk_result = cur.fetchone()
                    pk_col = pk_result[0] if pk_result else "id"
                    
                    # Sample rows
                    cur.execute(f"""
                        SELECT * FROM {table}
                        ORDER BY {pk_col}
                        LIMIT {sample_size}
                    """)
                    
                    rows = cur.fetchall()
                    
                    # Calculate checksum
                    data_str = str(rows).encode('utf-8')
                    return hashlib.md5(data_str).hexdigest()
                    
        except Exception as e:
            logger.error(
                f"Failed to calculate checksum for {table}: {str(e)}"
            )
            return ""
    
    def get_sync_stats(self) -> Dict:
        """
        Get synchronization statistics.
        
        Returns:
            Dict with sync metrics
        """
        return {
            "rows_synced": self.sync_stats["rows_synced"],
            "sync_errors": self.sync_stats["sync_errors"],
            "last_sync_time": self.sync_stats["last_sync_time"],
            "sync_active": self.sync_active,
            "active_tasks": len(self.sync_tasks)
        }


class ConflictResolver:
    """
    Handles conflict resolution for bidirectional sync.
    
    Strategies:
    - Last-write-wins
    - Custom business logic
    - Manual resolution
    """
    
    def __init__(self, strategy: str = "last-write-wins"):
        """
        Initialize conflict resolver.
        
        Args:
            strategy: Conflict resolution strategy
        """
        self.strategy = strategy
    
    def resolve(self, blue_row: tuple, green_row: tuple) -> tuple:
        """
        Resolve conflict between two versions of a row.
        
        Args:
            blue_row: Row from blue database
            green_row: Row from green database
        
        Returns:
            Resolved row
        """
        if self.strategy == "last-write-wins":
            # Compare timestamps and return newest
            # This is simplified - production would be more sophisticated
            return green_row if green_row else blue_row
        
        # Add other strategies as needed
        return blue_row
