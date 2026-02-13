# Migration Guide

Complete step-by-step guide for executing zero-downtime database migrations.

## Prerequisites

Before starting a migration, ensure you have:

- [ ] Access to both blue and green databases
- [ ] Database backup completed
- [ ] Migration tested in staging environment
- [ ] Rollback procedure documented
- [ ] Monitoring dashboards prepared
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (even though downtime is zero)

## Migration Process

### Phase 1: Preparation (Day -7 to Day -1)

#### 1.1 Plan the Migration

```bash
# Document the changes
cat > migration_plan.md << EOF
# Migration Plan

## Objective
[What are we migrating?]

## Schema Changes
[List all schema changes]

## Data Changes
[List any data transformations]

## Risks
[Identify potential risks]

## Rollback Plan
[Document rollback steps]
EOF
```

#### 1.2 Test in Staging

```bash
# Clone production to staging
pg_dump production_db | psql staging_blue

# Run migration in staging
python examples/full_migration_demo.py

# Verify results
psql staging_green -c "SELECT COUNT(*) FROM users"
```

#### 1.3 Prepare Monitoring

```bash
# Setup monitoring dashboards
# - Replication lag
# - Error rates
# - Database performance
# - Application metrics
```

### Phase 2: Setup (Day 0, T-2 hours)

#### 2.1 Initialize Migration Manager

```python
from migrations.migration_manager import MigrationManager

# Connect to blue database
manager = MigrationManager("postgresql://user:pass@localhost:5432/blue_db")
manager.initialize_schema_version_table()

# Verify current version
current_version = manager.get_current_version()
print(f"Current version: {current_version}")
```

#### 2.2 Create Green Database

```bash
# Create green database
createdb green_db

# Or use Docker
docker-compose up -d postgres-green
```

#### 2.3 Apply New Schema to Green

```python
# Apply new schema
schema_sql = """
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),  -- New column
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_users_username ON users(username);
    CREATE INDEX idx_users_email ON users(email);
"""

await migration.setup_green_database(schema_sql)
```

### Phase 3: Replication (Day 0, T-1 hour)

#### 3.1 Start Logical Replication

```python
from deployment.blue_green_migration import BlueGreenMigration

migration = BlueGreenMigration(
    blue_conn="postgresql://user:pass@localhost:5432/blue_db",
    green_conn="postgresql://user:pass@localhost:5433/green_db"
)

# Start replication
await migration.start_replication()
```

#### 3.2 Monitor Replication Lag

```python
import asyncio

async def monitor_replication():
    while True:
        lag = await migration.verify_replication_lag()
        print(f"Replication lag: {lag['lag_seconds']:.2f}s")
        
        if lag["lag_seconds"] > 5.0:
            print("WARNING: High replication lag!")
        
        await asyncio.sleep(5)

# Run in background
asyncio.create_task(monitor_replication())
```

#### 3.3 Verify Initial Sync

```python
from sync.bidirectional_sync import BidirectionalSync

sync = BidirectionalSync(blue_conn, green_conn)

# Check consistency
results = await sync.verify_consistency(["users", "orders", "products"])

for table, result in results.items():
    if not result["consistent"]:
        print(f"WARNING: {table} is inconsistent!")
        print(f"Differences: {result['differences']}")
```

### Phase 4: Bidirectional Sync (Day 0, T-30 minutes)

#### 4.1 Start Bidirectional Sync

```python
# Define tables to sync
tables = ["users", "orders", "products", "sessions"]

# Start sync
await sync.start_sync(tables, interval=1)
```

#### 4.2 Verify Sync is Working

```python
# Insert test data in blue
with psycopg2.connect(blue_conn) as conn:
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO users (username, email) 
            VALUES ('test_user', 'test@example.com')
        """)
        conn.commit()

# Wait a moment
await asyncio.sleep(2)

# Verify it appears in green
with psycopg2.connect(green_conn) as conn:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT * FROM users 
            WHERE username = 'test_user'
        """)
        result = cur.fetchone()
        assert result is not None, "Sync not working!"
```

### Phase 5: Cutover (Day 0, T-0)

#### 5.1 Pre-Cutover Checks

```bash
# Checklist
[ ] Replication lag < 1 second
[ ] Data consistency verified
[ ] Application health good
[ ] Monitoring dashboards ready
[ ] Team on standby
[ ] Rollback procedure ready
```

#### 5.2 Execute Cutover

```python
# Perform cutover
print("Starting cutover...")
success = await migration.cutover_to_green(max_lag_seconds=1.0)

if not success:
    print("Cutover failed! Rolling back...")
    await migration.rollback_to_blue()
else:
    print("Cutover successful!")
```

#### 5.3 Verify Cutover

```python
# Check application is using green
# - Monitor connection counts
# - Check application logs
# - Verify write operations

await migration._verify_green_traffic()
```

### Phase 6: Monitoring (Day 0 to Day 7)

#### 6.1 Monitor Green Database

```bash
# Watch key metrics
watch -n 5 'psql green_db -c "
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
    FROM pg_stat_user_tables
    ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
    LIMIT 10
"'
```

#### 6.2 Check for Errors

```bash
# Application logs
tail -f /var/log/application.log | grep -i error

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

### Phase 7: Cleanup (Day 7)

#### 7.1 Stop Replication

```python
# Stop sync
await sync.stop_sync()

# Stop replication
await migration.stop_replication()
```

#### 7.2 Archive Blue Database

```bash
# Create backup
pg_dump blue_db > blue_db_final_backup.sql
gzip blue_db_final_backup.sql

# Move to archive storage
aws s3 cp blue_db_final_backup.sql.gz \
    s3://backups/blue_db_$(date +%Y%m%d).sql.gz
```

#### 7.3 Decommission Blue

```bash
# Only after confirming green is stable for 7+ days!

# Option 1: Drop database
dropdb blue_db

# Option 2: Revoke connections
psql -c "REVOKE CONNECT ON DATABASE blue_db FROM PUBLIC"
```

## Common Migration Patterns

### Pattern 1: Add Column

```python
# Migration for adding a column
migration = MigrationScript(
    version=1,
    description="Add email column",
    up_sql="""
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
        CREATE INDEX idx_users_email ON users(email);
    """,
    down_sql="""
        DROP INDEX idx_users_email;
        ALTER TABLE users DROP COLUMN email;
    """
)
```

### Pattern 2: Rename Table

```python
# Phase 1: Create new table with view for compatibility
migration_1 = MigrationScript(
    version=2,
    description="Rename table - Phase 1",
    up_sql="""
        CREATE TABLE new_name (LIKE old_name INCLUDING ALL);
        CREATE VIEW old_name AS SELECT * FROM new_name;
    """,
    down_sql="..."
)

# Phase 2: Drop old table (after application updated)
migration_2 = MigrationScript(
    version=3,
    description="Rename table - Phase 2",
    up_sql="DROP VIEW old_name",
    down_sql="..."
)
```

### Pattern 3: Change Column Type

```python
# Phase 1: Add new column
migration_1 = MigrationScript(
    version=4,
    description="Change column type - Phase 1",
    up_sql="""
        ALTER TABLE users ADD COLUMN user_id_new BIGINT;
        UPDATE users SET user_id_new = user_id::BIGINT;
    """,
    down_sql="..."
)

# Phase 2: Switch columns (after app updated)
migration_2 = MigrationScript(
    version=5,
    description="Change column type - Phase 2",
    up_sql="""
        ALTER TABLE users DROP COLUMN user_id;
        ALTER TABLE users RENAME COLUMN user_id_new TO user_id;
    """,
    down_sql="..."
)
```

## Rollback Procedures

### Emergency Rollback

```python
# Immediate rollback if issues detected
await migration.rollback_to_blue()

# Verify blue is receiving traffic
await migration._verify_blue_traffic()

# Alert team
send_alert("Migration rolled back to blue database")
```

### Rollback Checklist

```bash
[ ] Green database set to read-only
[ ] Blue database accepting writes
[ ] Application using blue connection string
[ ] Monitoring confirms blue traffic
[ ] Stakeholders notified
[ ] Post-mortem scheduled
```

## Best Practices

### 1. Always Test First

```bash
# Test in staging
./test_migration_staging.sh

# Test rollback
./test_rollback_staging.sh
```

### 2. Monitor Everything

```bash
# Key metrics to watch:
- Replication lag
- Error rates
- Query performance
- Connection counts
- Disk usage
```

### 3. Communicate

```bash
# Before migration
./notify_stakeholders.sh "Migration starting in 1 hour"

# During migration
./notify_stakeholders.sh "Migration in progress"

# After migration
./notify_stakeholders.sh "Migration complete"
```

### 4. Document

```bash
# Create runbook
cat > runbook.md << EOF
# Migration Runbook

## Commands
[All commands used]

## Observations
[What happened]

## Issues
[Any problems encountered]

## Duration
Start: [timestamp]
End: [timestamp]
Total: [duration]
EOF
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed troubleshooting steps.

## Next Steps

After successful migration:

1. Monitor for 7 days
2. Document lessons learned
3. Update runbooks
4. Archive blue database
5. Celebrate! 🎉
