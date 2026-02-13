#!/bin/bash
# Simplified test runner for Python 3.14 compatibility

set -e

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found."
    echo "Run: ./setup_tests.sh"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "pytest not found. Installing..."
    pip install pytest pytest-asyncio pytest-cov httpx
fi

# Run tests
echo "Running tests..."
echo ""

# Simple test execution (no coverage for now due to setup issues)
pytest tests/ -v --tb=short

echo ""
echo "✓ Tests complete!"
echo ""
echo "Note: For coverage reports, ensure all dependencies are installed."
echo "Run: pip install pytest-cov"
