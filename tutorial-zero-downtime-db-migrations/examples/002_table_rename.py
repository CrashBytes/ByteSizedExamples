"""
Example Migration: Rename Table with Zero Downtime

This demonstrates a safe table rename using views to maintain compatibility
during the transition period.

Part of CrashBytes Zero-Downtime Database Migrations Tutorial
"""

from migrations.migration_manager import MigrationManager, MigrationScript


def run():
    """Execute the table rename migration"""
    
    # Initialize migration manager
    manager = MigrationManager(
        "postgresql://postgres:postgres@localhost:5432/mydb"
    )
    manager.initialize_schema_version_table()
    
    # Migration 1: Create new table and start dual-write
    migration_1 = MigrationScript(
        version=2,
        description="Phase 1: Create new customers table",
        up_sql="""
            -- Create new table with desired name
            CREATE TABLE customers (
                LIKE user_accounts INCLUDING ALL
            );
            
            -- Create view for backward compatibility
            CREATE OR REPLACE VIEW user_accounts AS
            SELECT * FROM customers;
            
            -- Create triggers to sync writes from old to new
            CREATE OR REPLACE FUNCTION sync_user_accounts_to_customers()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    INSERT INTO customers VALUES (NEW.*);
                ELSIF TG_OP = 'UPDATE' THEN
                    UPDATE customers SET ROW = NEW.* WHERE id = NEW.id;
                ELSIF TG_OP = 'DELETE' THEN
                    DELETE FROM customers WHERE id = OLD.id;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER user_accounts_sync_trigger
            AFTER INSERT OR UPDATE OR DELETE ON user_accounts
            FOR EACH ROW EXECUTE FUNCTION sync_user_accounts_to_customers();
        """,
        down_sql="""
            DROP TRIGGER IF EXISTS user_accounts_sync_trigger ON user_accounts;
            DROP FUNCTION IF EXISTS sync_user_accounts_to_customers();
            DROP VIEW IF EXISTS user_accounts;
            DROP TABLE IF EXISTS customers;
        """
    )
    
    print("Phase 1: Creating new customers table...")
    if not migration_1.apply(manager):
        print("✗ Phase 1 failed")
        return False
    print("✓ Phase 1 complete")
    
    print("\nNext steps:")
    print("1. Copy data from user_accounts to customers")
    print("2. Deploy application v2 (uses customers table)")
    print("3. Verify all writes go to customers table")
    print("4. Run Phase 2 to drop old table")
    
    return True


def run_phase_2():
    """
    Phase 2: Remove old table after migration is complete
    Run this after verifying the new table is working
    """
    manager = MigrationManager(
        "postgresql://postgres:postgres@localhost:5432/mydb"
    )
    
    migration_2 = MigrationScript(
        version=3,
        description="Phase 2: Remove old user_accounts table",
        up_sql="""
            -- Drop trigger
            DROP TRIGGER IF EXISTS user_accounts_sync_trigger ON user_accounts;
            DROP FUNCTION IF EXISTS sync_user_accounts_to_customers();
            
            -- Drop old table
            DROP TABLE IF EXISTS user_accounts CASCADE;
            
            -- Recreate view for any stragglers
            CREATE OR REPLACE VIEW user_accounts AS
            SELECT * FROM customers;
        """,
        down_sql="""
            -- This rollback is complex - would need to recreate
            -- the original table from customers
            CREATE TABLE user_accounts (
                LIKE customers INCLUDING ALL
            );
            INSERT INTO user_accounts SELECT * FROM customers;
        """
    )
    
    print("Phase 2: Removing old user_accounts table...")
    if not migration_2.apply(manager):
        print("✗ Phase 2 failed")
        return False
    print("✓ Phase 2 complete")
    print("\n✓ Table rename complete!")
    
    return True


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "phase2":
        run_phase_2()
    else:
        run()
