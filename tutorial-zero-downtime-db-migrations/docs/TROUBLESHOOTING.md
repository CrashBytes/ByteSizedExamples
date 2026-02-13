# Troubleshooting Guide

Common issues and solutions for zero-downtime database migrations.

## Quick Diagnosis

Run the diagnostic script to identify issues:

```bash
python scripts/diagnose.py
```

## Common Issues

### 1. High Replication Lag

**Symptoms:**
- Replication lag > 5 seconds
- Cutover delayed or failing
- Data consistency issues

**Diagnosis:**

```python
# Check replication lag
lag = await migration.verify_replication_lag()
print(f"Lag: {lag['lag_seconds']}s, {lag['lag_bytes']} bytes")
```

**Solutions:**

#### Option A: Increase Resources

```bash
# Increase PostgreSQL work_mem
psql -c "ALTER SYSTEM SET work_mem = '256MB'"
psql -c "SELECT pg_reload_conf()"

# Increase max_wal_senders
psql -c "ALTER SYSTEM SET max_wal_senders = 20"
# Requires restart
sudo systemctl restart postgresql
```

#### Option B: Reduce Load

```bash
# Temporarily reduce write load
# - Delay batch jobs
# - Throttle application writes
# - Scale down non-essential services
```

#### Option C: Optimize Replication

```bash
# Check replication slot status
psql -c "SELECT * FROM pg_replication_slots"

# Check WAL sender status
psql -c "SELECT * FROM pg_stat_replication"

# Ensure logical replication is configured
psql -c "SHOW wal_level"  # Should be 'logical'
```

### 2. Data Inconsistency

**Symptoms:**
- Consistency check fails
- Row counts don't match
- Checksums differ

**Diagnosis:**

```python
# Run consistency check
results = await sync.verify_consistency(["users"])

for table, result in results.items():
    if not result["consistent"]:
        print(f"Table: {table}")
        print(f"Blue count: {result['blue_count']}")
        print(f"Green count: {result['green_count']}")
        print(f"Differences: {result['differences']}")
```

**Solutions:**

#### Check Sync Status

```python
# Verify sync is running
stats = sync.get_sync_stats()
print(f"Sync active: {stats['sync_active']}")
print(f"Rows synced: {stats['rows_synced']}")
print(f"Errors: {stats['sync_errors']}")
```

#### Resync Data

```bash
# Stop sync
await sync.stop_sync()

# Truncate green tables
psql green_db -c "TRUNCATE users CASCADE"

# Restart replication
await migration.start_replication()

# Restart sync
await sync.start_sync(["users"])
```

#### Investigate Specific Rows

```sql
-- Find missing rows
SELECT id FROM blue_db.users
EXCEPT
SELECT id FROM green_db.users;

-- Find extra rows
SELECT id FROM green_db.users
EXCEPT
SELECT id FROM blue_db.users;

-- Compare specific row
SELECT * FROM blue_db.users WHERE id = 123;
SELECT * FROM green_db.users WHERE id = 123;
```

### 3. Replication Not Starting

**Symptoms:**
- Replication fails to initialize
- No data flowing to green
- Replication slot errors

**Diagnosis:**

```bash
# Check replication configuration
psql blue_db -c "SHOW wal_level"
psql blue_db -c "SHOW max_wal_senders"
psql blue_db -c "SHOW max_replication_slots"

# Check for existing publications
psql blue_db -c "SELECT * FROM pg_publication"

# Check for existing subscriptions
psql green_db -c "SELECT * FROM pg_subscription"
```

**Solutions:**

#### Enable Logical Replication

```bash
# Edit postgresql.conf
sudo vim /etc/postgresql/15/main/postgresql.conf

# Add/modify:
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Reset Replication

```bash
# Drop existing replication objects
psql blue_db -c "DROP PUBLICATION IF EXISTS migration_pub CASCADE"
psql green_db -c "DROP SUBSCRIPTION IF EXISTS migration_sub"

# Restart replication setup
await migration.start_replication()
```

#### Check Permissions

```sql
-- Verify replication permissions
SELECT * FROM pg_roles WHERE rolname = 'postgres';

-- Grant replication if needed
ALTER USER postgres WITH REPLICATION;
```

### 4. Connection Errors

**Symptoms:**
- Cannot connect to database
- Connection timeouts
- "Too many connections" errors

**Diagnosis:**

```bash
# Check current connections
psql -c "SELECT count(*) FROM pg_stat_activity"

# Check max connections
psql -c "SHOW max_connections"

# See active connections
psql -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname"
```

**Solutions:**

#### Increase Connection Limit

```bash
# Edit postgresql.conf
sudo vim /etc/postgresql/15/main/postgresql.conf

# Increase max_connections
max_connections = 200

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Kill Idle Connections

```sql
-- Find idle connections
SELECT pid, usename, application_name, state, state_change
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';
```

#### Use Connection Pooling

```bash
# Install pgBouncer
sudo apt install pgbouncer

# Configure pgBouncer
sudo vim /etc/pgbouncer/pgbouncer.ini

# Add:
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### 5. Cutover Fails

**Symptoms:**
- Cutover returns False
- Application still using blue
- Traffic not switching to green

**Diagnosis:**

```python
# Check migration status
status = migration.get_status()
print(f"Replication active: {status['replication_active']}")
print(f"Cutover complete: {status['cutover_complete']}")

# Verify green is ready
await migration._verify_green_traffic()
```

**Solutions:**

#### Manual Cutover Steps

```python
# 1. Manually set blue read-only
with psycopg2.connect(blue_conn) as conn:
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SET default_transaction_read_only = on")

# 2. Wait for replication
await asyncio.sleep(5)

# 3. Update application config manually
# (Update connection string in config file)

# 4. Restart application
# (Or trigger config reload)
```

#### Rollback and Retry

```python
# Roll back to blue
await migration.rollback_to_blue()

# Wait a moment
await asyncio.sleep(10)

# Investigate issues
# Fix problems

# Retry cutover
await migration.cutover_to_green()
```

### 6. Performance Degradation

**Symptoms:**
- Slow queries after migration
- High CPU/memory usage
- Increased response times

**Diagnosis:**

```sql
-- Find slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Check table statistics
SELECT schemaname, tablename, 
       n_tup_ins, n_tup_upd, n_tup_del,
       n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Check index usage
SELECT schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**Solutions:**

#### Rebuild Indexes

```sql
-- Rebuild all indexes
REINDEX DATABASE green_db;

-- Or specific table
REINDEX TABLE users;
```

#### Vacuum Database

```sql
-- Full vacuum
VACUUM FULL ANALYZE;

-- Or specific tables
VACUUM ANALYZE users;
VACUUM ANALYZE orders;
```

#### Update Statistics

```sql
-- Update query planner statistics
ANALYZE;

-- Or specific table
ANALYZE users;
```

### 7. Migration Script Errors

**Symptoms:**
- Migration script fails
- Syntax errors in SQL
- Constraint violations

**Diagnosis:**

```python
# Check migration history
history = manager.get_migration_history()
for migration in history:
    print(f"v{migration['version']}: {migration['description']}")
    print(f"  Applied: {migration['applied_at']}")
    print(f"  Time: {migration['execution_time_ms']}ms")
```

**Solutions:**

#### Test Migration SQL

```bash
# Test SQL in transaction
psql test_db << EOF
BEGIN;
-- Your migration SQL here
ALTER TABLE users ADD COLUMN test VARCHAR(255);
ROLLBACK;  -- Don't commit
EOF
```

#### Fix and Retry

```python
# Rollback failed migration
manager.rollback_migration(version=5, down_sql="...")

# Fix SQL
fixed_sql = """
    ALTER TABLE users 
    ADD COLUMN email VARCHAR(255)
"""

# Retry
manager.apply_migration(version=5, "Fixed migration", fixed_sql, "...")
```

### 8. Disk Space Issues

**Symptoms:**
- "No space left on device"
- WAL files accumulating
- Database writes failing

**Diagnosis:**

```bash
# Check disk space
df -h

# Check PostgreSQL data directory
du -sh /var/lib/postgresql/15/main/

# Check WAL directory
du -sh /var/lib/postgresql/15/main/pg_wal/

# Count WAL files
ls -l /var/lib/postgresql/15/main/pg_wal/ | wc -l
```

**Solutions:**

#### Clean WAL Files

```sql
-- Check WAL settings
SHOW wal_keep_size;
SHOW max_wal_size;

-- Checkpoint to flush WAL
CHECKPOINT;

-- Adjust retention
ALTER SYSTEM SET wal_keep_size = '1GB';
SELECT pg_reload_conf();
```

#### Archive Old Data

```bash
# Archive and compress old WAL files
cd /var/lib/postgresql/15/main/pg_wal/
find . -name "*.old" -mtime +7 -exec gzip {} \;
find . -name "*.gz" -mtime +30 -delete
```

### 9. Lock Contention

**Symptoms:**
- Migration hangs
- Queries waiting for locks
- Timeout errors

**Diagnosis:**

```sql
-- Check for locks
SELECT 
    locktype, 
    relation::regclass, 
    mode, 
    granted,
    pid,
    pg_blocking_pids(pid) AS blocked_by
FROM pg_locks
WHERE NOT granted;

-- Check blocking queries
SELECT 
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocker.pid AS blocker_pid,
    blocker.query AS blocker_query
FROM pg_stat_activity AS blocked
JOIN pg_stat_activity AS blocker 
    ON blocker.pid = ANY(pg_blocking_pids(blocked.pid));
```

**Solutions:**

#### Kill Blocking Queries

```sql
-- Terminate blocking query
SELECT pg_terminate_backend(12345);  -- Replace with actual PID
```

#### Reduce Lock Timeout

```sql
-- Set statement timeout
SET statement_timeout = '30s';

-- Set lock timeout
SET lock_timeout = '10s';
```

## Getting Help

### Collect Debug Information

```bash
# Run comprehensive diagnostics
python scripts/collect_debug_info.py > debug_$(date +%Y%m%d_%H%M%S).txt
```

### Check Logs

```bash
# Application logs
tail -n 1000 logs/migration.log

# PostgreSQL logs
sudo tail -n 1000 /var/log/postgresql/postgresql-15-main.log

# System logs
sudo journalctl -u postgresql -n 1000
```

### Report Issue

When reporting issues, include:

1. **Version Information**
   ```bash
   python --version
   psql --version
   ```

2. **Error Messages**
   - Full error text
   - Stack traces
   - Log excerpts

3. **Configuration**
   - Database version
   - Migration settings
   - System resources

4. **Steps to Reproduce**
   - What you did
   - What you expected
   - What actually happened

### Resources

- **GitHub Issues**: [Report a bug](https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations/issues)
- **Tutorial**: [Full article](https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/)
- **PostgreSQL Docs**: [Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)

## Prevention Tips

1. **Test Thoroughly**: Always test in staging first
2. **Monitor Proactively**: Watch metrics before issues occur
3. **Have Rollback Ready**: Practice rollback procedures
4. **Document Everything**: Keep detailed runbooks
5. **Communicate**: Keep team informed of progress
6. **Start Small**: Test with smaller datasets first
7. **Schedule Wisely**: Migrate during low-traffic periods

## Emergency Contacts

```bash
# Add your team's emergency contacts
DBA Team: [contact info]
Platform Team: [contact info]
On-Call Engineer: [contact info]
```
