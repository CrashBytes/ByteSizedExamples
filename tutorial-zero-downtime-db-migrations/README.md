# Zero-Downtime Database Migrations - Enterprise Patterns

[![Tests](https://github.com/CrashBytes/tutorial-zero-downtime-db-migrations/workflows/Tests/badge.svg)](https://github.com/CrashBytes/tutorial-zero-downtime-db-migrations/actions)
[![codecov](https://codecov.io/gh/CrashBytes/tutorial-zero-downtime-db-migrations/branch/main/graph/badge.svg)](https://codecov.io/gh/CrashBytes/tutorial-zero-downtime-db-migrations)

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CrashBytes](https://img.shields.io/badge/CrashBytes-Tutorial-00e6b3)](https://crashbytes.com)

Production-ready framework for executing zero-downtime database migrations using blue-green deployments, bidirectional synchronization, and automated rollback procedures.

**Full Tutorial:** [Zero-Downtime Database Migrations - Enterprise Patterns](https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/)

## Overview

This repository implements battle-tested patterns for database migrations in production systems processing billions of transactions daily. Used in Fortune 500 financial services and e-commerce platforms.

### Key Features

* Versioned Schema Management - Track and apply migrations with automatic version control
* Blue-Green Deployments - Zero-downtime cutover with automated rollback
* Bidirectional Sync - Keep databases consistent during migration
* Automated Testing - Comprehensive test suite for migration validation
* Production Monitoring - Health checks and metrics for migration status
* Rollback Automation - Rapid recovery under pressure

## Security Warning

**IMPORTANT**: This repository contains example credentials for local development only.

* DO NOT use default passwords (`postgres/postgres`) in production
* Change all credentials before deploying to production
* Read [SECURITY.md](SECURITY.md) for production security guidelines

The Docker Compose and example configurations use default passwords **for demonstration purposes only**. Always use strong, unique passwords and proper secrets management in production environments.

## Architecture

### Migration Strategies

#### 1. Expand-Contract Pattern

```
Phase 1: Expand (Add new schema)
├── Add new columns/tables
├── Deploy app v2 (writes both)
├── Backfill historical data
└── Validate consistency

Phase 2: Contract (Remove old schema)
├── Deploy app v3 (uses new only)
├── Verify no old usage
├── Drop old columns/tables
└── Complete migration
```

#### 2. Blue-Green Migration

```
Preparation:
├── Set up green database (new schema)
├── Configure replication
├── Test cutover procedures
└── Prepare rollback plan

Execution:
├── Start bidirectional sync
├── Cutover application to green
├── Verify green health
├── Stop replication
└── Decommission blue
```

## Quick Start

### Prerequisites

* Python 3.9+
* PostgreSQL 13+ (or compatible database)
* Docker & Docker Compose (for local testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations.git
cd crashbytes-tutorial-zero-downtime-db-migrations

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Local Testing with Docker

```bash
# Start blue and green PostgreSQL instances
docker-compose up -d

# Wait for databases to be ready
sleep 10

# Run example migration
python examples/full_migration_demo.py
```

## Usage Examples

### Basic Schema Migration

```python
from migrations.migration_manager import MigrationManager

# Initialize migration manager
manager = MigrationManager("postgresql://user:pass@localhost:5432/mydb")
manager.initialize_schema_version_table()

# Apply migration
result = manager.apply_migration(
    version=1,
    description="Add user_preferences table",
    up_sql="""
        CREATE TABLE user_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            preferences JSONB DEFAULT '{}'
        )
    """,
    down_sql="DROP TABLE user_preferences"
)

if result:
    print("Migration applied successfully!")
```

### Blue-Green Migration

```python
from deployment.blue_green_migration import BlueGreenMigration
import asyncio

async def perform_migration():
    # Initialize blue-green migration
    migration = BlueGreenMigration(
        blue_conn="postgresql://user:pass@localhost:5432/blue_db",
        green_conn="postgresql://user:pass@localhost:5433/green_db"
    )
    
    # Setup green database with new schema
    await migration.setup_green_database()
    
    # Start replication
    await migration.start_replication()
    
    # Wait for sync
    while True:
        lag = await migration.verify_replication_lag()
        if lag["lag_seconds"] < 1.0:
            break
        print(f"Replication lag: {lag['lag_seconds']:.2f}s")
        await asyncio.sleep(1)
    
    # Perform cutover
    await migration.cutover_to_green()
    print("Migration complete!")

# Run migration
asyncio.run(perform_migration())
```

### Bidirectional Data Sync

```python
from sync.bidirectional_sync import BidirectionalSync
import asyncio

async def sync_databases():
    # Initialize sync
    sync = BidirectionalSync(
        blue_conn="postgresql://user:pass@localhost:5432/blue_db",
        green_conn="postgresql://user:pass@localhost:5433/green_db"
    )
    
    # Start synchronization
    tables = ["users", "orders", "products"]
    await sync.start_sync(tables)
    
    # Verify consistency
    results = await sync.verify_consistency(tables)
    print(f"Consistency check: {results}")

asyncio.run(sync_databases())
```

## Project Structure

```
crashbytes-tutorial-zero-downtime-db-migrations/
├── migrations/
│   ├── __init__.py
│   └── migration_manager.py           # Version-controlled migrations
├── deployment/
│   ├── __init__.py
│   └── blue_green_migration.py        # Blue-green orchestration
├── sync/
│   ├── __init__.py
│   └── bidirectional_sync.py          # Data synchronization
├── tests/
│   ├── __init__.py
│   └── test_migration.py              # Test suite
├── examples/
│   ├── 001_add_column.py              # Example: Add column
│   ├── 002_table_rename.py            # Example: Rename table
│   └── full_migration_demo.py         # Complete workflow
├── config/
│   ├── config.example.yml             # Configuration template
│   └── logging.yml                    # Logging configuration
├── docs/
│   ├── ARCHITECTURE.md                # Architecture overview
│   ├── MIGRATION_GUIDE.md             # Step-by-step guide
│   └── TROUBLESHOOTING.md             # Common issues
├── docker-compose.yml                 # Local test environment
├── requirements.txt                   # Python dependencies
└── README.md                          # This file
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=migrations --cov=deployment --cov=sync tests/

# Run specific test
pytest tests/test_migration.py::TestMigration::test_schema_migration_applies_cleanly
```

## Migration Execution Checklist

### Pre-Migration

* Backup both databases
* Test migration in staging
* Verify rollback procedures
* Prepare monitoring dashboards
* Brief stakeholders

### During Migration

* Start replication
* Verify data consistency
* Execute cutover
* Monitor application health
* Verify green database performance

### Post-Migration

* Stop replication
* Archive blue database
* Document lessons learned
* Update runbooks

## Configuration

Copy the example configuration:

```bash
cp config/config.example.yml config/config.yml
```

Edit `config/config.yml` with your database credentials:

```yaml
databases:
  blue:
    host: localhost
    port: 5432
    database: blue_db
    user: postgres
    password: your_password
  
  green:
    host: localhost
    port: 5433
    database: green_db
    user: postgres
    password: your_password

migration:
  batch_size: 1000
  sync_interval: 1
  max_replication_lag: 5.0
  
monitoring:
  enable_metrics: true
  prometheus_port: 9090
```

## Monitoring

The framework includes built-in monitoring:

* **Replication Lag** - Track sync delay between databases
* **Migration Progress** - Monitor migration execution
* **Data Consistency** - Verify data integrity
* **Performance Metrics** - Database throughput and latency

Access monitoring dashboard at `http://localhost:8080/metrics` when running.

## Troubleshooting

### Common Issues

**High replication lag:**

```bash
# Check replication status
python -c "from deployment.blue_green_migration import BlueGreenMigration; import asyncio; m = BlueGreenMigration('blue', 'green'); asyncio.run(m.verify_replication_lag())"
```

**Data inconsistency:**

```bash
# Run consistency check
python examples/verify_consistency.py
```

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Resources

* [Tutorial: GitOps with ArgoCD on Kubernetes](https://crashbytes.com/articles/tutorial-gitops-argocd-kubernetes-enterprise-deployment-2025/)
* [Tutorial: Internal Developer Platform with Backstage](https://crashbytes.com/articles/tutorial-internal-developer-platform-backstage-kubernetes-production-2025/)
* [Tutorial: MLOps Pipeline on Kubernetes](https://crashbytes.com/articles/tutorial-mlops-pipeline-kubernetes-production-deployment-2025/)

## Support

* **Blog:** [crashbytes.com](https://crashbytes.com)
* **Issues:** [GitHub Issues](https://github.com/crashbytes/crashbytes-tutorial-zero-downtime-db-migrations/issues)
* **Tutorial:** [Full Article](https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/)

---

Built by [CrashBytes](https://crashbytes.com) - Empowering developers with production-ready patterns.
