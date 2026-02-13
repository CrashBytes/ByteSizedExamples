.PHONY: test test-unit test-integration test-fast test-coverage test-ci lint format install clean help

# Default Python interpreter
PYTHON := python3

# Test commands
test: ## Run all tests with coverage
	cd backend && ./run_tests.sh all

test-unit: ## Run only unit tests
	cd backend && ./run_tests.sh unit

test-integration: ## Run only integration tests
	cd backend && ./run_tests.sh integration

test-fast: ## Run fast tests (exclude slow tests)
	cd backend && ./run_tests.sh fast

test-coverage: ## Run tests and generate HTML coverage report
	cd backend && ./run_tests.sh coverage
	@echo "Coverage report: backend/htmlcov/index.html"

test-ci: ## Run tests in CI mode
	cd backend && ./run_tests.sh ci

# Code quality
lint: ## Run linting checks
	cd backend && flake8 app tests --max-line-length=100
	cd backend && black --check app tests
	cd backend && isort --check-only app tests

format: ## Auto-format code
	cd backend && black app tests
	cd backend && isort app tests

type-check: ## Run type checking
	cd backend && mypy app --ignore-missing-imports

security: ## Run security checks
	cd backend && safety check
	cd backend && bandit -r app

# Setup
install: ## Install dependencies
	cd backend && pip install -r requirements.txt
	cd backend && pip install -r requirements-dev.txt

install-dev: ## Install development dependencies
	cd backend && pip install pytest pytest-asyncio pytest-cov httpx
	cd backend && pip install flake8 black isort mypy
	cd backend && pip install safety bandit

# Cleanup
clean: ## Clean test artifacts
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type d -name '*.egg-info' -exec rm -rf {} +
	find . -type d -name htmlcov -exec rm -rf {} +
	find . -type f -name '.coverage' -delete
	find . -type f -name 'coverage.xml' -delete

# Documentation
docs: ## Generate test documentation
	@echo "Test documentation: backend/tests/README.md"
	@echo "API documentation: Run 'make docs-api'"

docs-api: ## Generate API documentation
	cd backend && pdoc --html --output-dir docs app

# Help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
