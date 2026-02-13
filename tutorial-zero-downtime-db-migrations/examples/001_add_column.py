"""
Example Migration: Add Column to Existing Table

This demonstrates the expand-contract pattern for adding a new column
without downtime.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
"""

from migrations.migration_manager import MigrationManager, MigrationScript


def run():
    """Execute the migration"""
    
    # Initialize migration manager
    manager = MigrationManager(
        "postgresql://postgres:postgres@localhost:5432/mydb"
    )
    manager.initialize_schema_version_table()
    
    # Define migration
    migration = MigrationScript(
        version=1,
        description="Add email column to users table",
        up_sql="""
            -- Phase 1: Expand - Add new column with nullable constraint
            ALTER TABLE users 
            ADD COLUMN email VARCHAR(255);
            
            -- Add index for email lookups
            CREATE INDEX idx_users_email ON users(email);
            
            -- Add comment for documentation
            COMMENT ON COLUMN users.email IS 
                'User email address - Added in migration 001';
        """,
        down_sql="""
            -- Rollback: Remove the email column
            DROP INDEX IF EXISTS idx_users_email;
            ALTER TABLE users DROP COLUMN IF EXISTS email;
        """
    )
    
    # Apply migration
    print("Applying migration: Add email column...")
    success = migration.apply(manager)
    
    if success:
        print("✓ Migration applied successfully")
        print("\nNext steps:")
        print("1. Deploy application v2 (writes to email column)")
        print("2. Backfill historical data")
        print("3. Add NOT NULL constraint in next migration")
    else:
        print("✗ Migration failed")
        return False
    
    # Display current version
    version = manager.get_current_version()
    print(f"\nCurrent schema version: {version}")
    
    return True


if __name__ == "__main__":
    run()
