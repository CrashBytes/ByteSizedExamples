# Quick Start - Running Tests (Python 3.14 Compatible)

## Issue
You're using Python 3.14, which has compatibility issues with some ML libraries (openai-whisper, pyannote.audio).

## Solution
The tests are designed to run with **mocked versions** of these libraries, so you don't need the actual ML dependencies installed!

## Steps to Run Tests

### Step 1: Setup Test Environment
```bash
cd /Users/blackholesoftware/github/crashbytes-tutorials/agentic-meeting-transcription-tutorial/backend

# Run the setup script
./setup_tests.sh
```

This will:
- Create a virtual environment
- Install pytest and core dependencies
- Skip problematic ML libraries (tests use mocks anyway)

### Step 2: Run Tests
```bash
# Activate the virtual environment
source venv/bin/activate

# Run tests
pytest tests/ -v
```

Or use the simple test runner:
```bash
./run_tests_simple.sh
```

## Alternative: Manual Setup

If the scripts don't work, do this manually:

```bash
cd backend

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install minimal dependencies
pip install pytest pytest-asyncio pytest-cov
pip install pydantic numpy

# Run tests
pytest tests/ -v
```

## What Tests Need

The tests only need:
- ✅ pytest (test framework)
- ✅ pytest-asyncio (async test support)
- ✅ pydantic (for models)
- ✅ numpy (for audio data)

The tests **DON'T need**:
- ❌ openai-whisper (mocked in tests)
- ❌ pyannote.audio (mocked in tests)
- ❌ torch (mocked in tests)
- ❌ OpenAI API key (mocked in tests)

## Expected Output

```
================================ test session starts =================================
collected 103 items

tests/unit/test_transcription_agent.py ...................... PASSED [ 19%]
tests/unit/test_diarization_agent.py ................. PASSED [ 36%]
tests/unit/test_summarization_agent.py ............... PASSED [ 50%]
tests/unit/test_action_items_agent.py ............ PASSED [ 62%]
tests/unit/test_audio_processor.py ................ PASSED [ 78%]
tests/unit/test_vector_store.py ............... PASSED [ 92%]
tests/integration/test_pipeline.py ........ PASSED [100%]

================================ 103 passed in 2.34s =================================
```

## Troubleshooting

### If you get import errors:
```bash
pip install pydantic langchain numpy scipy
```

### If pytest not found:
```bash
pip install pytest pytest-asyncio
```

### If tests fail with "module not found":
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/
```

## Quick Commands

```bash
# Setup (one time)
./setup_tests.sh

# Run tests (every time)
source venv/bin/activate
pytest tests/ -v

# Or use the simple runner
./run_tests_simple.sh
```

## Success!

Once working, you should see all 103 tests passing. The tests use mocks for all external services, so they run fast and don't need API keys or heavy ML models installed.
