"""
Blue-Green Database Migration Orchestrator

Handles zero-downtime database migrations using blue-green deployment pattern.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/
"""

import time
import asyncio
from typing import Dict, Optional
import logging
import psycopg2
from datetime import datetime

logger = logging.getLogger(__name__)


class BlueGreenMigration:
    """
    Orchestrates blue-green database migration with zero downtime.
    
    Process:
    1. Setup green database with new schema
    2. Start replication from blue to green
    3. Verify replication lag is minimal
    4. Cutover application to green
    5. Stop replication and decommission blue
    """
    
    def __init__(self, blue_conn: str, green_conn: str):
        """
        Initialize blue-green migration orchestrator.
        
        Args:
            blue_conn: Connection string for blue (current) database
            green_conn: Connection string for green (new) database
        """
        self.blue_conn = blue_conn
        self.green_conn = green_conn
        self.replication_active = False
        self.cutover_complete = False
        
    async def setup_green_database(self, schema_sql: Optional[str] = None) -> bool:
        """
        Initialize green database with new schema.
        
        Steps:
        1. Create green database
        2. Apply new schema
        3. Configure replication slots
        
        Args:
            schema_sql: Optional SQL for new schema. If None, copies from blue.
        
        Returns:
            True if successful
        """
        logger.info("Setting up green database")
        
        try:
            with psycopg2.connect(self.green_conn) as conn:
                with conn.cursor() as cur:
                    if schema_sql:
                        # Apply new schema
                        logger.info("Applying new schema to green database")
                        cur.execute(schema_sql)
                    else:
                        # Copy schema from blue
                        logger.info("Copying schema from blue to green")
                        # This would use pg_dump/pg_restore in production
                        # Simplified for example
                        pass
                    
                    conn.commit()
            
            logger.info("Green database setup complete")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup green database: {str(e)}")
            return False
    
    async def start_replication(self) -> bool:
        """
        Start bidirectional data synchronization.
        
        In production, this would use:
        - pglogical
        - Bucardo
        - Custom trigger-based replication
        
        Returns:
            True if replication started successfully
        """
        logger.info("Starting replication blue → green")
        
        try:
            # Configure logical replication (simplified example)
            with psycopg2.connect(self.blue_conn) as conn:
                with conn.cursor() as cur:
                    # Create publication on blue (source)
                    cur.execute("""
                        SELECT 1 FROM pg_publication 
                        WHERE pubname = 'blue_to_green_pub'
                    """)
                    
                    if not cur.fetchone():
                        cur.execute("""
                            CREATE PUBLICATION blue_to_green_pub 
                            FOR ALL TABLES
                        """)
                        logger.info("Created publication on blue database")
                    
                    conn.commit()
            
            # Create subscription on green (target)
            # Note: This is simplified. In production, you'd need proper
            # connection strings and replication slot management
            logger.info("Configuring subscription on green database")
            
            self.replication_active = True
            logger.info("Replication started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start replication: {str(e)}")
            return False
    
    async def verify_replication_lag(self) -> Dict[str, float]:
        """
        Check replication lag between blue and green.
        
        Returns:
            Dict with lag metrics:
            - lag_seconds: Replication lag in seconds
            - lag_bytes: Bytes behind in replication
        """
        try:
            with psycopg2.connect(self.blue_conn) as conn:
                with conn.cursor() as cur:
                    # Query replication status
                    cur.execute("""
                        SELECT 
                            EXTRACT(EPOCH FROM (now() - replay_lsn::text::pg_lsn)) AS lag_seconds,
                            pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
                        FROM pg_stat_replication
                        WHERE application_name = 'green_subscriber'
                    """)
                    
                    result = cur.fetchone()
                    
                    if result:
                        lag_seconds = result[0] if result[0] else 0.0
                        lag_bytes = result[1] if result[1] else 0
                        
                        return {
                            "lag_seconds": lag_seconds,
                            "lag_bytes": lag_bytes
                        }
                    else:
                        # No replication data available
                        return {"lag_seconds": 0.0, "lag_bytes": 0}
                        
        except Exception as e:
            logger.warning(f"Could not verify replication lag: {str(e)}")
            return {"lag_seconds": 0.0, "lag_bytes": 0}
    
    async def cutover_to_green(self, max_lag_seconds: float = 1.0) -> bool:
        """
        Perform cutover to green database.
        
        Steps:
        1. Set blue to read-only
        2. Wait for replication catch-up
        3. Update application config
        4. Verify green is receiving traffic
        
        Args:
            max_lag_seconds: Maximum acceptable lag before cutover
        
        Returns:
            True if cutover successful
        """
        logger.info("Starting cutover to green database")
        
        try:
            # Step 1: Set blue to read-only
            logger.info("Setting blue database to read-only")
            await self._set_read_only(self.blue_conn, True)
            
            # Step 2: Wait for replication catch-up
            logger.info("Waiting for replication to catch up")
            max_wait_time = 300  # 5 minutes timeout
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                lag = await self.verify_replication_lag()
                
                if lag["lag_seconds"] < max_lag_seconds:
                    logger.info(
                        f"Replication caught up: {lag['lag_seconds']:.2f}s lag"
                    )
                    break
                
                logger.info(
                    f"Waiting for replication: {lag['lag_seconds']:.2f}s lag"
                )
                await asyncio.sleep(1)
            else:
                logger.error("Replication catch-up timeout")
                await self.rollback_to_blue()
                return False
            
            # Step 3: Update application connection
            # In production, this would trigger application redeployment
            # or update connection pooler configuration
            logger.info("Ready to update application to use green database")
            logger.info(
                "UPDATE APPLICATION CONFIG: Change database connection to green"
            )
            
            # Step 4: Verify traffic on green
            await asyncio.sleep(5)  # Wait for connections to switch
            await self._verify_green_traffic()
            
            self.cutover_complete = True
            logger.info("Cutover to green database complete")
            return True
            
        except Exception as e:
            logger.error(f"Cutover failed: {str(e)}")
            logger.info("Initiating rollback to blue")
            await self.rollback_to_blue()
            return False
    
    async def rollback_to_blue(self) -> bool:
        """
        Emergency rollback to blue database.
        
        Returns:
            True if rollback successful
        """
        logger.warning("Rolling back to blue database")
        
        try:
            # Set green to read-only
            await self._set_read_only(self.green_conn, True)
            
            # Enable writes on blue
            await self._set_read_only(self.blue_conn, False)
            
            # Update application config
            logger.info(
                "ROLLBACK: Update application to use blue database"
            )
            
            # Verify traffic on blue
            await asyncio.sleep(5)
            await self._verify_blue_traffic()
            
            self.cutover_complete = False
            logger.info("Rollback to blue database complete")
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {str(e)}")
            return False
    
    async def stop_replication(self) -> bool:
        """
        Stop replication after successful cutover.
        
        Returns:
            True if replication stopped successfully
        """
        logger.info("Stopping replication")
        
        try:
            with psycopg2.connect(self.green_conn) as conn:
                with conn.cursor() as cur:
                    # Drop subscription on green
                    cur.execute("""
                        DROP SUBSCRIPTION IF EXISTS green_from_blue_sub
                    """)
                    conn.commit()
            
            with psycopg2.connect(self.blue_conn) as conn:
                with conn.cursor() as cur:
                    # Drop publication on blue
                    cur.execute("""
                        DROP PUBLICATION IF EXISTS blue_to_green_pub
                    """)
                    conn.commit()
            
            self.replication_active = False
            logger.info("Replication stopped")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop replication: {str(e)}")
            return False
    
    async def _set_read_only(self, conn_string: str, read_only: bool) -> None:
        """
        Set database to read-only mode.
        
        Args:
            conn_string: Database connection string
            read_only: True for read-only, False for read-write
        """
        mode = "read only" if read_only else "read write"
        logger.info(f"Setting database to {mode}")
        
        try:
            with psycopg2.connect(conn_string) as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    if read_only:
                        cur.execute("SET default_transaction_read_only = on")
                    else:
                        cur.execute("SET default_transaction_read_only = off")
                        
        except Exception as e:
            logger.error(f"Failed to set read-only mode: {str(e)}")
            raise
    
    async def _verify_green_traffic(self) -> bool:
        """
        Verify green database is receiving writes.
        
        Returns:
            True if traffic detected
        """
        logger.info("Verifying green database traffic")
        
        try:
            with psycopg2.connect(self.green_conn) as conn:
                with conn.cursor() as cur:
                    # Check for recent activity
                    cur.execute("""
                        SELECT COUNT(*) 
                        FROM pg_stat_database 
                        WHERE datname = current_database()
                        AND xact_commit > 0
                    """)
                    
                    count = cur.fetchone()[0]
                    
                    if count > 0:
                        logger.info("Green database is receiving traffic")
                        return True
                    else:
                        logger.warning("No traffic detected on green database")
                        return False
                        
        except Exception as e:
            logger.error(f"Failed to verify green traffic: {str(e)}")
            return False
    
    async def _verify_blue_traffic(self) -> bool:
        """
        Verify blue database is receiving writes.
        
        Returns:
            True if traffic detected
        """
        logger.info("Verifying blue database traffic")
        
        try:
            with psycopg2.connect(self.blue_conn) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT COUNT(*) 
                        FROM pg_stat_database 
                        WHERE datname = current_database()
                        AND xact_commit > 0
                    """)
                    
                    count = cur.fetchone()[0]
                    
                    if count > 0:
                        logger.info("Blue database is receiving traffic")
                        return True
                    else:
                        logger.warning("No traffic detected on blue database")
                        return False
                        
        except Exception as e:
            logger.error(f"Failed to verify blue traffic: {str(e)}")
            return False
    
    def get_status(self) -> Dict:
        """
        Get current migration status.
        
        Returns:
            Status dictionary with migration state
        """
        return {
            "replication_active": self.replication_active,
            "cutover_complete": self.cutover_complete,
            "timestamp": datetime.now().isoformat()
        }
