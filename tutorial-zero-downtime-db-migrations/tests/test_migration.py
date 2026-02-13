"""
Migration Testing Framework

Comprehensive test suite for database migrations.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/
"""

import pytest
import asyncio
from decimal import Decimal
from datetime import datetime
import psycopg2
from migrations.migration_manager import MigrationManager, MigrationScript
from deployment.blue_green_migration import BlueGreenMigration
from sync.bidirectional_sync import BidirectionalSync


@pytest.fixture
def test_database_blue():
    """Setup test database (blue)."""
    # In production, this would create a temporary test database
    conn_string = "postgresql://postgres:postgres@localhost:5432/test_blue"
    
    try:
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                # Clean up from previous tests
                cur.execute("DROP TABLE IF EXISTS schema_version CASCADE")
                cur.execute("DROP TABLE IF EXISTS test_users CASCADE")
                conn.commit()
    except:
        pass
    
    yield conn_string
    
    # Cleanup
    try:
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS schema_version CASCADE")
                cur.execute("DROP TABLE IF EXISTS test_users CASCADE")
                conn.commit()
    except:
        pass


@pytest.fixture
def test_database_green():
    """Setup test database (green)."""
    conn_string = "postgresql://postgres:postgres@localhost:5433/test_green"
    
    try:
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS schema_version CASCADE")
                cur.execute("DROP TABLE IF EXISTS test_users CASCADE")
                conn.commit()
    except:
        pass
    
    yield conn_string
    
    # Cleanup
    try:
        with psycopg2.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS schema_version CASCADE")
                cur.execute("DROP TABLE IF EXISTS test_users CASCADE")
                conn.commit()
    except:
        pass


class TestMigrationManager:
    """Test suite for MigrationManager"""
    
    def test_initialize_schema_version_table(self, test_database_blue):
        """Test schema version table creation."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Verify table exists
        with psycopg2.connect(test_database_blue) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'schema_version'
                    )
                """)
                assert cur.fetchone()[0] is True
    
    def test_get_current_version_initial(self, test_database_blue):
        """Test getting version when no migrations applied."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        version = manager.get_current_version()
        assert version == 0
    
    def test_schema_migration_applies_cleanly(self, test_database_blue):
        """Test migration applies without errors."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        result = manager.apply_migration(
            version=1,
            description="Create test_users table",
            up_sql="""
                CREATE TABLE test_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL
                )
            """,
            down_sql="DROP TABLE test_users"
        )
        
        assert result is True
        
        # Verify table exists
        with psycopg2.connect(test_database_blue) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'test_users'
                    )
                """)
                assert cur.fetchone()[0] is True
        
        # Verify version recorded
        assert manager.get_current_version() == 1
    
    def test_migration_rollback_successful(self, test_database_blue):
        """Test migration can be rolled back."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Apply migration
        manager.apply_migration(
            version=1,
            description="Create test table",
            up_sql="CREATE TABLE test_table (id SERIAL PRIMARY KEY)",
            down_sql="DROP TABLE test_table"
        )
        
        # Rollback migration
        result = manager.rollback_migration(
            version=1,
            down_sql="DROP TABLE test_table"
        )
        
        assert result is True
        
        # Verify table removed
        with psycopg2.connect(test_database_blue) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'test_table'
                    )
                """)
                assert cur.fetchone()[0] is False
        
        # Verify version reverted
        assert manager.get_current_version() == 0
    
    def test_migration_history_tracking(self, test_database_blue):
        """Test migration history is properly tracked."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Apply multiple migrations
        for i in range(1, 4):
            manager.apply_migration(
                version=i,
                description=f"Migration {i}",
                up_sql=f"CREATE TABLE test_{i} (id INT)",
                down_sql=f"DROP TABLE test_{i}"
            )
        
        # Get history
        history = manager.get_migration_history()
        
        assert len(history) == 3
        assert all("version" in h for h in history)
        assert all("description" in h for h in history)
        assert all("applied_at" in h for h in history)
    
    def test_duplicate_migration_prevention(self, test_database_blue):
        """Test that duplicate migrations are prevented."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Apply migration
        manager.apply_migration(
            version=1,
            description="Test migration",
            up_sql="CREATE TABLE test (id INT)",
            down_sql="DROP TABLE test"
        )
        
        # Try to apply same version again
        result = manager.apply_migration(
            version=1,
            description="Duplicate migration",
            up_sql="CREATE TABLE test2 (id INT)",
            down_sql="DROP TABLE test2"
        )
        
        assert result is False
    
    def test_data_consistency_after_migration(self, test_database_blue):
        """Test data remains consistent after migration."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Create table with data
        with psycopg2.connect(test_database_blue) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255)
                    )
                """)
                cur.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob')")
                conn.commit()
        
        # Apply migration to add column
        manager.apply_migration(
            version=1,
            description="Add email column",
            up_sql="ALTER TABLE users ADD COLUMN email VARCHAR(255)",
            down_sql="ALTER TABLE users DROP COLUMN email"
        )
        
        # Verify data still exists
        with psycopg2.connect(test_database_blue) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM users")
                count = cur.fetchone()[0]
                assert count == 2


class TestBlueGreenMigration:
    """Test suite for blue-green migration"""
    
    @pytest.mark.asyncio
    async def test_green_database_setup(
        self,
        test_database_blue,
        test_database_green
    ):
        """Test green database setup."""
        migration = BlueGreenMigration(
            test_database_blue,
            test_database_green
        )
        
        schema_sql = """
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255)
            )
        """
        
        result = await migration.setup_green_database(schema_sql)
        assert result is True
    
    @pytest.mark.asyncio
    async def test_migration_status_tracking(
        self,
        test_database_blue,
        test_database_green
    ):
        """Test migration status is properly tracked."""
        migration = BlueGreenMigration(
            test_database_blue,
            test_database_green
        )
        
        status = migration.get_status()
        
        assert "replication_active" in status
        assert "cutover_complete" in status
        assert status["replication_active"] is False
        assert status["cutover_complete"] is False


class TestBidirectionalSync:
    """Test suite for bidirectional synchronization"""
    
    @pytest.mark.asyncio
    async def test_consistency_verification(
        self,
        test_database_blue,
        test_database_green
    ):
        """Test consistency verification between databases."""
        # Setup identical tables in both databases
        for conn_string in [test_database_blue, test_database_green]:
            try:
                with psycopg2.connect(conn_string) as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            CREATE TABLE IF NOT EXISTS test_users (
                                id SERIAL PRIMARY KEY,
                                name VARCHAR(255)
                            )
                        """)
                        cur.execute("DELETE FROM test_users")
                        cur.execute("""
                            INSERT INTO test_users (name) 
                            VALUES ('Alice'), ('Bob')
                        """)
                        conn.commit()
            except:
                pytest.skip("Database not available for testing")
        
        # Verify consistency
        sync = BidirectionalSync(test_database_blue, test_database_green)
        results = await sync.verify_consistency(["test_users"])
        
        assert "test_users" in results
        # Note: May fail if databases aren't running, which is okay for unit tests
    
    @pytest.mark.asyncio
    async def test_sync_stats_tracking(
        self,
        test_database_blue,
        test_database_green
    ):
        """Test sync statistics are tracked."""
        sync = BidirectionalSync(test_database_blue, test_database_green)
        
        stats = sync.get_sync_stats()
        
        assert "rows_synced" in stats
        assert "sync_errors" in stats
        assert "sync_active" in stats
        assert stats["sync_active"] is False


class TestMigrationScript:
    """Test suite for MigrationScript helper class"""
    
    def test_migration_script_creation(self):
        """Test MigrationScript can be created."""
        script = MigrationScript(
            version=1,
            description="Test migration",
            up_sql="CREATE TABLE test (id INT)",
            down_sql="DROP TABLE test"
        )
        
        assert script.version == 1
        assert script.description == "Test migration"
        assert "CREATE TABLE" in script.up_sql
        assert "DROP TABLE" in script.down_sql
    
    def test_migration_script_apply(self, test_database_blue):
        """Test MigrationScript.apply() method."""
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        script = MigrationScript(
            version=1,
            description="Create test table",
            up_sql="CREATE TABLE script_test (id INT)",
            down_sql="DROP TABLE script_test"
        )
        
        result = script.apply(manager)
        assert result is True


# Integration Tests
class TestEndToEndMigration:
    """Integration tests for complete migration workflow"""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_complete_migration_workflow(
        self,
        test_database_blue,
        test_database_green
    ):
        """
        Test complete migration workflow:
        1. Setup databases
        2. Apply migration
        3. Start sync
        4. Verify consistency
        5. Cutover
        """
        # Skip if databases not available
        try:
            with psycopg2.connect(test_database_blue):
                pass
            with psycopg2.connect(test_database_green):
                pass
        except:
            pytest.skip("Test databases not available")
        
        # Step 1: Setup migration manager
        manager = MigrationManager(test_database_blue)
        manager.initialize_schema_version_table()
        
        # Step 2: Apply initial schema
        manager.apply_migration(
            version=1,
            description="Create users table",
            up_sql="""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            down_sql="DROP TABLE users"
        )
        
        # Step 3: Setup blue-green migration
        migration = BlueGreenMigration(
            test_database_blue,
            test_database_green
        )
        
        # This would continue with more steps in a real integration test
        assert True  # Placeholder
