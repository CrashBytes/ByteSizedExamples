# Contributing to AI Agent Project

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

---

## Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Python 3.11+ installed
- Git installed and configured
- GitHub account
- Docker and Docker Compose (for testing)
- Basic understanding of:
  - Python async/await
  - REST APIs
  - LLMs and prompting
  - Docker and Kubernetes basics

### Find an Issue

1. Check [existing issues](https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production/issues)
2. Look for issues tagged with `good first issue` or `help wanted`
3. Comment on an issue to claim it
4. If you want to work on something new, create an issue first to discuss

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/crashbytes-tutorial-ai-agents-langchain-production.git
cd crashbytes-tutorial-ai-agents-langchain-production

# Add upstream remote
git remote add upstream https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production.git
```

### 2. Create Virtual Environment

```bash
# Create environment
python -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt  # If exists
pip install black ruff mypy pytest pytest-cov
```

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
# At minimum, set:
# - OPENAI_API_KEY (or ANTHROPIC_API_KEY)
# - POSTGRES_PASSWORD
```

### 4. Start Infrastructure

```bash
# Start Redis and PostgreSQL
docker-compose up -d redis postgres

# Initialize database
python scripts/init_db.py
```

### 5. Verify Setup

```bash
# Run tests
pytest

# Start API server
uvicorn src.api.main:app --reload

# Check health
curl http://localhost:8000/health
```

---

## Making Changes

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name

# OR for bug fixes
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add comments for complex logic
- Update documentation as needed
- Write tests for new functionality

### 3. Test Your Changes

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_agent.py -v

# Run with coverage
pytest --cov=src --cov-report=html

# Check coverage report
open htmlcov/index.html
```

### 4. Format and Lint

```bash
# Format code
black src/ tests/

# Check linting
ruff check src/ tests/

# Type checking
mypy src/ --ignore-missing-imports
```

---

## Coding Standards

### Python Style

- Follow [PEP 8](https://pep8.org/) style guide
- Use [Black](https://black.readthedocs.io/) for formatting
- Use [Ruff](https://docs.astral.sh/ruff/) for linting
- Use [MyPy](http://mypy-lang.org/) for type checking

### Code Organization

```python
# Standard library imports first
import asyncio
import logging
from typing import Dict, List, Optional

# Third-party imports second
from fastapi import FastAPI
from pydantic import BaseModel

# Local imports last
from src.agents.config import get_settings
from src.tools.base_tool import BaseTool
```

### Naming Conventions

```python
# Classes: PascalCase
class AgentExecutor:
    pass

# Functions/methods: snake_case
async def execute_agent():
    pass

# Constants: UPPER_SNAKE_CASE
MAX_ITERATIONS = 10

# Private: leading underscore
def _internal_helper():
    pass

# Protected: leading underscore
class MyClass:
    def _protected_method(self):
        pass
```

### Documentation

```python
def my_function(param1: str, param2: int = 0) -> Dict[str, Any]:
    """
    Short description of function.
    
    Longer description with more details about what the
    function does, when to use it, etc.
    
    Args:
        param1: Description of param1
        param2: Description of param2 with default
        
    Returns:
        Dict with result data containing:
            - key1: Description
            - key2: Description
    
    Raises:
        ValueError: When param1 is invalid
        
    Example:
        >>> result = my_function("test", 42)
        >>> print(result["key1"])
        value
    """
    pass
```

### Error Handling

```python
# Good: Specific exceptions, informative messages
try:
    result = await some_operation()
except ValueError as e:
    logger.error(f"Invalid value: {e}", exc_info=True)
    raise ValueError(f"Failed to process input: {e}") from e
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise

# Bad: Bare except, no context
try:
    result = await some_operation()
except:
    pass
```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

# Use appropriate log levels
logger.debug("Detailed debugging information")
logger.info("General informational messages")
logger.warning("Warning about potential issues")
logger.error("Error that needs attention", exc_info=True)

# Include context
logger.info(
    "Processing request",
    extra={
        "user_id": user_id,
        "conversation_id": conv_id
    }
)
```

---

## Testing

### Test Structure

```python
import pytest
import asyncio

# Test classes group related tests
class TestAgentExecutor:
    """Tests for AgentExecutor functionality"""
    
    @pytest.mark.asyncio
    async def test_basic_execution(self):
        """Test basic agent execution"""
        # Arrange
        agent = AgentExecutor(tools=[])
        
        # Act
        result = await agent.execute("test query")
        
        # Assert
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test agent handles errors gracefully"""
        # Test implementation
        pass
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and edge cases
- Test error conditions
- Mock external dependencies
- Use fixtures for common setup

### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_agent.py

# Specific test
pytest tests/test_agent.py::TestAgentExecutor::test_basic_execution

# With markers
pytest -m unit  # Only unit tests
pytest -m integration  # Only integration tests

# With coverage
pytest --cov=src --cov-report=html
```

---

## Submitting Changes

### 1. Commit Your Changes

```bash
# Stage changes
git add src/new_feature.py tests/test_new_feature.py

# Commit with descriptive message
git commit -m "Add new feature: description

- Detailed point 1
- Detailed point 2

Fixes #123"
```

### Commit Message Format

```
<type>: <short summary>

<longer description (optional)>

<footer (optional)>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: Add weather tool integration

Implements WeatherTool class with OpenWeatherMap API support.
Includes input validation, error handling, and metrics.

Closes #45

---

fix: Resolve memory leak in Redis connection

Fixed connection pooling issue that caused connections
to not be properly released.

Fixes #67

---

docs: Update deployment guide with GKE instructions

Added step-by-step guide for deploying to Google Kubernetes Engine
```

### 2. Push to Your Fork

```bash
# Push your branch
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:
   - **Title**: Clear, concise description
   - **Description**: What, why, and how
   - **Related Issues**: Link to issues
   - **Testing**: How you tested the changes
   - **Screenshots**: If UI changes

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] PR description is complete

---

## Review Process

### What to Expect

1. **Automated Checks** - CI/CD runs automatically
   - Linting (Black, Ruff)
   - Type checking (MyPy)
   - Tests (Pytest)
   - Security scanning (Trivy)

2. **Code Review** - Maintainers will review
   - Usually within 48 hours
   - May request changes
   - Be responsive to feedback

3. **Approval** - Once approved:
   - Maintainer will merge
   - Your contribution is live!

### Responding to Feedback

```bash
# Make requested changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Address review feedback

- Fixed issue A
- Updated test for B
- Clarified documentation for C"

# Push to update PR
git push origin feature/your-feature-name
```

### Keeping PR Updated

```bash
# Sync with upstream main
git fetch upstream
git rebase upstream/main

# Resolve any conflicts
# ... fix conflicts ...
git add .
git rebase --continue

# Force push (only for your branch!)
git push origin feature/your-feature-name --force
```

---

## Types of Contributions

### 1. Bug Fixes

- Fix existing issues
- Add regression tests
- Update documentation if needed

### 2. New Features

- Discuss in issue first
- Follow existing patterns
- Add comprehensive tests
- Update documentation

### 3. Tool Development

- Extend BaseTool class
- Add validation
- Include error handling
- Document usage
- Add examples

### 4. Documentation

- Fix typos and errors
- Improve clarity
- Add examples
- Update guides

### 5. Performance Improvements

- Profile before and after
- Include benchmarks
- Document trade-offs
- Test thoroughly

---

## Getting Help

- **Discord**: [Join our Discord](https://discord.gg/crashbytes)
- **GitHub Discussions**: [Ask questions](https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production/discussions)
- **Issues**: [Report bugs](https://github.com/crashbytes/crashbytes-tutorial-ai-agents-langchain-production/issues)
- **Tutorial**: [Full tutorial on crashbytes.com](https://crashbytes.com/articles/tutorial-ai-agents-langchain-production-kubernetes-deployment-2025)

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website

Thank you for contributing to make AI agents more accessible and production-ready!

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
