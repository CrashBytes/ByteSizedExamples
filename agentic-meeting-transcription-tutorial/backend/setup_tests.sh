#!/bin/bash
# Quick setup script for testing

set -e

echo "Setting up test environment..."

cd "$(dirname "$0")"

# Remove old venv if it exists
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create new venv
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install core dependencies first (skip problematic ones)
echo "Installing core dependencies..."
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv
pip install langchain langchain-openai
pip install numpy scipy soundfile

# Install testing dependencies
echo "Installing testing dependencies..."
pip install pytest pytest-asyncio pytest-cov httpx

# Install optional dependencies (may fail on Python 3.14)
echo "Installing optional dependencies (some may be skipped)..."
pip install openai qdrant-client sentence-transformers sqlalchemy || true
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu || true

echo ""
echo "✓ Basic setup complete!"
echo ""
echo "Note: Some ML dependencies (whisper, pyannote) skipped due to Python 3.14 compatibility."
echo "Tests will run with mocked versions of these services."
echo ""
echo "To run tests:"
echo "  source venv/bin/activate"
echo "  pytest tests/"
echo ""
