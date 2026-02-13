#!/bin/bash
# Test runner script for the Agentic Meeting Transcription System

set -e

echo "================================"
echo "Agentic Meeting Transcription Tests"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo -e "${GREEN}Running test suite...${NC}"
echo ""

# Parse command line arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-true}"

case $TEST_TYPE in
    unit)
        echo "Running unit tests only..."
        if [ "$COVERAGE" = "true" ]; then
            pytest tests/unit/ --cov=app --cov-report=term-missing -v
        else
            pytest tests/unit/ -v
        fi
        ;;
    
    integration)
        echo "Running integration tests only..."
        if [ "$COVERAGE" = "true" ]; then
            pytest tests/integration/ --cov=app --cov-report=term-missing -v
        else
            pytest tests/integration/ -v
        fi
        ;;
    
    fast)
        echo "Running fast tests (excluding slow tests)..."
        if [ "$COVERAGE" = "true" ]; then
            pytest -m "not slow" --cov=app --cov-report=term-missing -v
        else
            pytest -m "not slow" -v
        fi
        ;;
    
    slow)
        echo "Running slow tests only..."
        pytest -m "slow" -v
        ;;
    
    coverage)
        echo "Running all tests with detailed coverage report..."
        pytest --cov=app --cov-report=html --cov-report=term-missing --cov-fail-under=80 -v
        echo ""
        echo -e "${GREEN}Coverage report generated in htmlcov/index.html${NC}"
        ;;
    
    ci)
        echo "Running CI test suite..."
        pytest --cov=app --cov-report=xml --cov-report=term --cov-fail-under=80 -v --tb=short
        ;;
    
    all|*)
        echo "Running all tests..."
        if [ "$COVERAGE" = "true" ]; then
            pytest --cov=app --cov-report=term-missing --cov-fail-under=80 -v
        else
            pytest -v
        fi
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

exit $TEST_EXIT_CODE
