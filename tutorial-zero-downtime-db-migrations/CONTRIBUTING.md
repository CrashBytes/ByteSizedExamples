# Contributing to Zero-Downtime Database Migrations

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Python version, PostgreSQL version)
- **Error messages and logs**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Rationale** for the enhancement
- **Use cases** where this would be valuable
- **Potential implementation** approach (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** with clear, focused commits
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Ensure tests pass** (`pytest`)
6. **Follow code style** (see below)
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Docker & Docker Compose (for testing)

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/crashbytes-tutorial-zero-downtime-db-migrations.git
cd crashbytes-tutorial-zero-downtime-db-migrations

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements.txt
pip install -e .

# Start test databases
docker-compose up -d

# Run tests
pytest
```

## Code Style

### Python Style Guide

This project follows [PEP 8](https://pep8.org/) with some modifications:

- **Line length**: 88 characters (Black default)
- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Imports**: Grouped and sorted (stdlib, third-party, local)

### Formatting

We use [Black](https://black.readthedocs.io/) for code formatting:

```bash
# Format code
black .

# Check formatting
black --check .
```

### Linting

We use [flake8](https://flake8.pycqa.org/) for linting:

```bash
# Run linter
flake8 migrations/ deployment/ sync/ tests/

# Common issues to avoid:
# - Unused imports
# - Undefined names
# - Line too long
```

### Type Hints

Use type hints for function signatures:

```python
from typing import List, Dict, Optional

def process_data(
    items: List[str],
    config: Dict[str, str],
    optional_param: Optional[int] = None
) -> bool:
    """Process data with type hints."""
    pass
```

## Testing

### Writing Tests

- **Test files**: Place in `tests/` directory
- **Test naming**: Start with `test_`
- **Test coverage**: Aim for >80% coverage
- **Test types**: Unit tests and integration tests

Example test:

```python
import pytest
from migrations.migration_manager import MigrationManager

def test_migration_applies_successfully(test_database):
    """Test that migration applies without errors."""
    manager = MigrationManager(test_database)
    manager.initialize_schema_version_table()
    
    result = manager.apply_migration(
        version=1,
        description="Test migration",
        up_sql="CREATE TABLE test (id INT)",
        down_sql="DROP TABLE test"
    )
    
    assert result is True
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_migration.py

# Run with coverage
pytest --cov=migrations --cov=deployment --cov=sync

# Run with verbose output
pytest -v

# Run integration tests only
pytest -m integration
```

## Documentation

### Docstrings

Use Google-style docstrings:

```python
def calculate_checksum(data: bytes, algorithm: str = "md5") -> str:
    """
    Calculate checksum for given data.
    
    Args:
        data: Binary data to checksum
        algorithm: Hash algorithm to use (md5, sha256)
    
    Returns:
        Hexadecimal checksum string
    
    Raises:
        ValueError: If algorithm is not supported
    
    Example:
        >>> calculate_checksum(b"hello", "md5")
        '5d41402abc4b2a76b9719d911017c592'
    """
    pass
```

### README Updates

When adding features, update:
- Feature list in README
- Usage examples
- Configuration options

### Tutorial Alignment

Ensure code stays aligned with the [tutorial article](https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/).

## Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(migration): add checksum validation

Adds MD5 checksum validation to ensure migration integrity.
Checksums are calculated and stored during migration application.

Closes #123
```

```
fix(sync): handle connection timeout gracefully

Adds retry logic for database connection timeouts during sync.
Prevents sync from failing on temporary network issues.
```

## Release Process

### Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Creating a Release

1. Update version in relevant files
2. Update CHANGELOG.md
3. Create and push tag
4. GitHub Actions will handle the rest

## Questions?

- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For questions and discussions
- **Blog**: [CrashBytes Tutorial](https://crashbytes.com/articles/tutorial-zero-downtime-database-migrations-enterprise-patterns-2025/)

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🙏
