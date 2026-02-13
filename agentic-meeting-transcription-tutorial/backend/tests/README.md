# Test Suite Documentation

## Overview

This comprehensive test suite for the Agentic Meeting Transcription System follows Test-Driven Development (TDD) principles and achieves 80%+ code coverage as required by the Partnership Charter.

## Test Structure

```
tests/
├── __init__.py                      # Test package init
├── conftest.py                      # Shared fixtures and configuration
├── pytest.ini                       # Pytest configuration
├── unit/                            # Unit tests
│   ├── test_transcription_agent.py  # TranscriptionAgent tests
│   ├── test_diarization_agent.py    # DiarizationAgent tests
│   ├── test_summarization_agent.py  # SummarizationAgent tests
│   ├── test_action_items_agent.py   # ActionItemsAgent tests
│   ├── test_audio_processor.py      # Audio processing service tests
│   └── test_vector_store.py         # Vector store service tests
├── integration/                     # Integration tests
│   └── test_pipeline.py             # End-to-end pipeline tests
└── fixtures/                        # Test data and fixtures
```

## Running Tests

### Quick Start

```bash
# Run all tests with coverage
./run_tests.sh

# Run only unit tests
./run_tests.sh unit

# Run only integration tests
./run_tests.sh integration

# Run tests without coverage
./run_tests.sh all false

# Run fast tests only (exclude slow/GPU tests)
./run_tests.sh fast

# Generate HTML coverage report
./run_tests.sh coverage
```

### Using pytest Directly

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_transcription_agent.py

# Run specific test
pytest tests/unit/test_transcription_agent.py::TestTranscriptionAgent::test_transcribe_chunk_success

# Run with markers
pytest -m unit                    # Unit tests only
pytest -m integration             # Integration tests only
pytest -m "not slow"              # Exclude slow tests
pytest -m requires_openai         # Tests requiring OpenAI API

# Verbose output
pytest -v

# Show test coverage
pytest --cov=app --cov-report=term-missing

# Generate HTML coverage report
pytest --cov=app --cov-report=html
```

## Test Categories

### Unit Tests (tests/unit/)

Individual component tests with mocked dependencies:

- **test_transcription_agent.py** (20+ tests)
  - Whisper model initialization
  - Audio chunk transcription
  - File transcription
  - Confidence calculation
  - Error handling
  - Multi-language support

- **test_diarization_agent.py** (17+ tests)
  - Pyannote pipeline initialization
  - Speaker diarization
  - Segment processing
  - Overlap handling
  - Multiple speaker scenarios

- **test_summarization_agent.py** (15+ tests)
  - Summary generation (brief/medium/detailed)
  - Context integration
  - Transcript formatting
  - Error handling

- **test_action_items_agent.py** (12+ tests)
  - Action item extraction
  - Structured output parsing
  - Priority assignment
  - Assignee detection

- **test_audio_processor.py** (16+ tests)
  - Audio streaming
  - Chunk processing
  - Transcript assembly
  - Speaker attribution

- **test_vector_store.py** (15+ tests)
  - Meeting storage
  - Embedding generation
  - Deletion operations
  - Payload structure

### Integration Tests (tests/integration/)

End-to-end workflow tests:

- **test_pipeline.py** (8+ tests)
  - Complete processing pipeline
  - State management
  - Error recovery
  - Concurrent execution
  - Component integration

## Test Fixtures

### Shared Fixtures (conftest.py)

- `sample_audio_chunk` - Synthetic audio data for testing
- `sample_whisper_result` - Mock Whisper transcription output
- `sample_diarization_result` - Mock diarization output
- `sample_transcript` - Attributed transcript segments
- `sample_meeting_metadata` - Meeting metadata
- `mock_openai_client` - Mocked OpenAI LLM
- `mock_whisper_model` - Mocked Whisper model
- `mock_pyannote_pipeline` - Mocked Pyannote pipeline
- `mock_qdrant_client` - Mocked Qdrant vector DB
- `mock_sentence_transformer` - Mocked embedding model
- `test_audio_file` - Temporary test audio file
- `mock_websocket` - Mocked WebSocket connection

## Test Markers

Custom markers for test categorization:

```python
@pytest.mark.unit              # Unit test
@pytest.mark.integration       # Integration test
@pytest.mark.slow              # Slow-running test
@pytest.mark.requires_gpu      # Requires GPU/CUDA
@pytest.mark.requires_hf_token # Requires Hugging Face token
@pytest.mark.requires_openai   # Requires OpenAI API key
```

## Coverage Requirements

Per Partnership Charter Section 3.1:

- **Minimum coverage**: 80%
- **Focus areas**: Business logic, data processing, error handling
- **Excluded**: Third-party libraries, configuration files

Current coverage targets:
- Agents: 85%+ coverage
- Services: 85%+ coverage
- Orchestration: 80%+ coverage

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          ./run_tests.sh ci
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### Pre-commit Hooks

Tests run automatically before commits:

```bash
# .git/hooks/pre-commit
#!/bin/bash
cd backend
./run_tests.sh fast
```

## Mocking Strategy

### External Services

All external services are mocked to ensure:
- Tests run without API keys
- Fast execution
- Deterministic results
- No external dependencies

Mocked services:
- OpenAI API (GPT-4)
- Whisper model
- Pyannote pipeline
- Qdrant vector database
- SentenceTransformer embeddings

### Mocking Patterns

```python
# Mock at import time
with patch('module.Class', return_value=mock_instance):
    agent = Agent()

# Mock async methods
agent.method = AsyncMock(return_value=result)

# Mock properties
mock.attribute = value
```

## Writing New Tests

### Test Structure

```python
@pytest.mark.unit
class TestMyComponent:
    """Test suite for MyComponent"""
    
    @pytest.fixture
    def component(self, mock_dependency):
        """Create component with mocked dependencies"""
        with patch('module.Dependency', return_value=mock_dependency):
            return MyComponent()
    
    def test_initialization(self, component):
        """Test component initializes correctly"""
        assert component.attribute is not None
    
    @pytest.mark.asyncio
    async def test_async_method(self, component):
        """Test async method behavior"""
        result = await component.async_method()
        assert result is not None
```

### Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One assertion focus** per test (primary assertion)
3. **Descriptive names**: `test_method_condition_expected`
4. **Mock external dependencies** completely
5. **Test edge cases**: empty inputs, errors, boundaries
6. **Use fixtures** for common setup
7. **Async tests** need `@pytest.mark.asyncio`

## Debugging Tests

```bash
# Run with verbose output and stop on first failure
pytest -vsx

# Run with print statements visible
pytest -s

# Run with debugger on failure
pytest --pdb

# Show local variables on failure
pytest --showlocals

# Increase verbosity
pytest -vv
```

## Performance Testing

Slow tests are marked and can be skipped:

```bash
# Skip slow tests
pytest -m "not slow"

# Run only slow tests
pytest -m slow
```

## Continuous Monitoring

### Coverage Reports

Generated after each test run:
- Terminal: `--cov-report=term-missing`
- HTML: `--cov-report=html` → `htmlcov/index.html`
- XML: `--cov-report=xml` → `coverage.xml` (for CI)

### Coverage Goals

Track coverage trends:
```bash
# Check current coverage
pytest --cov=app --cov-report=term

# Fail if below 80%
pytest --cov=app --cov-fail-under=80
```

## Troubleshooting

### Common Issues

**Import errors:**
```bash
# Ensure PYTHONPATH includes app directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

**GPU tests failing:**
```bash
# Skip GPU tests if CUDA unavailable
pytest -m "not requires_gpu"
```

**OpenAI tests skipped:**
```bash
# Set real API key (will incur costs!)
export OPENAI_API_KEY="sk-..."
pytest -m requires_openai
```

**Async warnings:**
```bash
# Ensure pytest-asyncio is installed
pip install pytest-asyncio
```

## Next Steps

1. Run full test suite: `./run_tests.sh coverage`
2. Review coverage report: `open htmlcov/index.html`
3. Add tests for uncovered code
4. Integrate with CI/CD pipeline
5. Set up pre-commit hooks

## References

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
- [pytest-cov](https://github.com/pytest-dev/pytest-cov)
- Partnership Charter Section 3.1: Test-Driven Development
