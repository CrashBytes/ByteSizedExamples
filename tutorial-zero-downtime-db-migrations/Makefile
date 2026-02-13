.PHONY: help install install-dev test test-cov lint format clean docker-up docker-down docker-logs demo

help:
	@echo "Available commands:"
	@echo "  make install      - Install package"
	@echo "  make install-dev  - Install package with dev dependencies"
	@echo "  make test         - Run tests"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make lint         - Run linters"
	@echo "  make format       - Format code with black"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make docker-up    - Start test databases"
	@echo "  make docker-down  - Stop test databases"
	@echo "  make docker-logs  - Show database logs"
	@echo "  make demo         - Run full migration demo"

install:
	pip install -e .

install-dev:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=migrations --cov=deployment --cov=sync --cov-report=html --cov-report=term

test-unit:
	pytest tests/ -m unit

test-integration:
	pytest tests/ -m integration

lint:
	flake8 migrations/ deployment/ sync/ tests/
	mypy migrations/ deployment/ sync/

format:
	black migrations/ deployment/ sync/ tests/ examples/

format-check:
	black --check migrations/ deployment/ sync/ tests/ examples/

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-up:
	docker-compose up -d
	@echo "Waiting for databases to be ready..."
	@sleep 5
	@echo "Databases ready!"

docker-down:
	docker-compose down -v

docker-logs:
	docker-compose logs -f

docker-restart:
	docker-compose restart

demo:
	python examples/full_migration_demo.py

demo-rollback:
	python examples/full_migration_demo.py rollback

check: format-check lint test

all: format lint test

# Development workflow
dev-setup: install-dev docker-up
	@echo "Development environment ready!"

dev-teardown: docker-down clean
	@echo "Development environment cleaned!"

# Quick smoke test
smoke:
	pytest tests/ -m smoke -v

# Create logs directory
logs:
	mkdir -p logs
