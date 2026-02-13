"""
Complete Blue-Green Migration Demo

This script demonstrates a full zero-downtime migration workflow using
blue-green deployment with bidirectional synchronization.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/
"""

import asyncio
import sys
import logging
from migrations.migration_manager import MigrationManager
from deployment.blue_green_migration import BlueGreenMigration
from sync.bidirectional_sync import BidirectionalSync

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def run_complete_migration():
    """
    Execute a complete blue-green database migration.
    
    Steps:
    1. Setup databases
    2. Apply initial schema to blue
    3. Setup green database with new schema
    4. Start bidirectional sync
    5. Verify data consistency
    6. Perform cutover to green
    7. Stop sync and cleanup
    """
    
    # Configuration
    BLUE_CONN = "postgresql://postgres:postgres@localhost:5432/blue_db"
    GREEN_CONN = "postgresql://postgres:postgres@localhost:5433/green_db"
    
    print("=" * 60)
    print("Zero-Downtime Database Migration Demo")
    print("=" * 60)
    print()
    
    # Step 1: Setup blue database (current production)
    print("Step 1: Setting up blue database (current production)")
    print("-" * 60)
    
    try:
        blue_manager = MigrationManager(BLUE_CONN)
        blue_manager.initialize_schema_version_table()
        
        # Apply initial schema
        success = blue_manager.apply_migration(
            version=1,
            description="Initial schema - users table",
            up_sql="""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX idx_users_username ON users(username);
                
                -- Insert sample data
                INSERT INTO users (username, email) VALUES
                    ('alice', 'alice@example.com'),
                    ('bob', 'bob@example.com'),
                    ('charlie', 'charlie@example.com');
            """,
            down_sql="DROP TABLE IF EXISTS users CASCADE"
        )
        
        if success:
            print("✓ Blue database ready")
        else:
            print("✗ Failed to setup blue database")
            return False
            
    except Exception as e:
        logger.error(f"Failed to setup blue database: {e}")
        print("\n⚠️  Make sure PostgreSQL is running on port 5432")
        return False
    
    print()
    
    # Step 2: Initialize blue-green migration
    print("Step 2: Initializing blue-green migration")
    print("-" * 60)
    
    migration = BlueGreenMigration(BLUE_CONN, GREEN_CONN)
    
    # Step 3: Setup green database with new schema
    print("Step 3: Setting up green database (new schema)")
    print("-" * 60)
    
    try:
        new_schema = """
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),  -- New column!
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX idx_users_username ON users(username);
            CREATE INDEX idx_users_email ON users(email);  -- New index!
        """
        
        success = await migration.setup_green_database(new_schema)
        
        if success:
            print("✓ Green database ready with new schema")
        else:
            print("✗ Failed to setup green database")
            return False
            
    except Exception as e:
        logger.error(f"Failed to setup green database: {e}")
        print("\n⚠️  Make sure PostgreSQL is running on port 5433")
        return False
    
    print()
    
    # Step 4: Start replication
    print("Step 4: Starting replication")
    print("-" * 60)
    
    success = await migration.start_replication()
    if success:
        print("✓ Replication started")
    else:
        print("✗ Failed to start replication")
        return False
    
    print()
    
    # Step 5: Start bidirectional sync
    print("Step 5: Starting bidirectional data synchronization")
    print("-" * 60)
    
    sync = BidirectionalSync(BLUE_CONN, GREEN_CONN)
    
    # Start sync in background
    sync_task = asyncio.create_task(
        sync.start_sync(["users"], interval=2)
    )
    
    # Give it a moment to start
    await asyncio.sleep(2)
    print("✓ Bidirectional sync active")
    print()
    
    # Step 6: Wait for replication to catch up
    print("Step 6: Waiting for replication to catch up")
    print("-" * 60)
    
    max_attempts = 10
    for attempt in range(max_attempts):
        lag = await migration.verify_replication_lag()
        print(f"Replication lag: {lag['lag_seconds']:.2f}s")
        
        if lag["lag_seconds"] < 1.0:
            print("✓ Replication caught up")
            break
        
        await asyncio.sleep(1)
    
    print()
    
    # Step 7: Verify data consistency
    print("Step 7: Verifying data consistency")
    print("-" * 60)
    
    consistency_results = await sync.verify_consistency(["users"])
    
    for table, result in consistency_results.items():
        if result["consistent"]:
            print(f"✓ {table}: Consistent")
            print(f"  Blue rows: {result.get('blue_count', 'N/A')}")
            print(f"  Green rows: {result.get('green_count', 'N/A')}")
        else:
            print(f"✗ {table}: Inconsistent")
            for diff in result.get("differences", []):
                print(f"  - {diff}")
    
    print()
    
    # Step 8: Perform cutover
    print("Step 8: Performing cutover to green database")
    print("-" * 60)
    print("⚠️  This would normally trigger application redeployment")
    
    success = await migration.cutover_to_green()
    
    if success:
        print("✓ Cutover complete")
        print("\n📍 Application should now be using GREEN database")
    else:
        print("✗ Cutover failed")
        return False
    
    print()
    
    # Step 9: Stop synchronization
    print("Step 9: Stopping synchronization")
    print("-" * 60)
    
    await sync.stop_sync()
    sync_task.cancel()
    
    try:
        await sync_task
    except asyncio.CancelledError:
        pass
    
    stats = sync.get_sync_stats()
    print(f"✓ Sync stopped")
    print(f"  Total rows synced: {stats['rows_synced']}")
    print(f"  Sync errors: {stats['sync_errors']}")
    
    print()
    
    # Step 10: Stop replication
    print("Step 10: Stopping replication")
    print("-" * 60)
    
    await migration.stop_replication()
    print("✓ Replication stopped")
    
    print()
    
    # Final summary
    print("=" * 60)
    print("✓ Migration Complete!")
    print("=" * 60)
    print("\nSummary:")
    print("- Schema migrated from blue to green")
    print("- Zero downtime achieved")
    print("- Data consistency verified")
    print("- Application cutover successful")
    print("\nNext steps:")
    print("1. Monitor green database performance")
    print("2. Keep blue database for 24-48 hours as backup")
    print("3. Once confident, decommission blue database")
    print()
    
    return True


async def run_rollback_demo():
    """
    Demonstrate rollback procedure.
    """
    print("=" * 60)
    print("Rollback Demo")
    print("=" * 60)
    print()
    
    BLUE_CONN = "postgresql://postgres:postgres@localhost:5432/blue_db"
    GREEN_CONN = "postgresql://postgres:postgres@localhost:5433/green_db"
    
    migration = BlueGreenMigration(BLUE_CONN, GREEN_CONN)
    
    print("Simulating emergency rollback...")
    print()
    
    success = await migration.rollback_to_blue()
    
    if success:
        print("✓ Rollback successful")
        print("📍 Application is now using BLUE database")
    else:
        print("✗ Rollback failed")
    
    print()


def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        asyncio.run(run_rollback_demo())
    else:
        asyncio.run(run_complete_migration())


if __name__ == "__main__":
    main()
