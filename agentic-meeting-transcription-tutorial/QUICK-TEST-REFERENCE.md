# Quick Test Reference Card

## Run Tests
```bash
make test              # All tests with coverage
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make test-fast         # Skip slow tests
make test-coverage     # Generate HTML report
```

## Test Files
```
tests/
├── conftest.py                     # Fixtures
├── unit/
│   ├── test_transcription_agent.py # 20 tests
│   ├── test_diarization_agent.py   # 17 tests
│   ├── test_summarization_agent.py # 15 tests
│   ├── test_action_items_agent.py  # 12 tests
│   ├── test_audio_processor.py     # 16 tests
│   └── test_vector_store.py        # 15 tests
└── integration/
    └── test_pipeline.py            # 8 tests
```

## Coverage Goal
**80%+ required** (Partnership Charter)
**85%+ targeted**

## Common Commands
```bash
# Specific test
pytest tests/unit/test_transcription_agent.py::test_name -v

# With coverage
pytest --cov=app --cov-report=term-missing

# By marker
pytest -m unit
pytest -m integration
pytest -m "not slow"

# Debug
pytest -vsx          # Verbose, show output, stop on fail
pytest --pdb         # Drop to debugger on failure
```

## Test Markers
- `@pytest.mark.unit` - Unit test
- `@pytest.mark.integration` - Integration test
- `@pytest.mark.slow` - Long-running
- `@pytest.mark.requires_openai` - Needs API key
- `@pytest.mark.requires_gpu` - Needs CUDA

## CI/CD
- **Triggers**: Push to main/develop, PRs
- **Python**: 3.10, 3.11
- **Steps**: Lint → Unit → Integration → Coverage
- **Required**: 80%+ coverage

## Code Quality
```bash
make lint        # Check code quality
make format      # Auto-format code
make type-check  # Run mypy
make security    # Security scan
```

## Fixtures Available
- `sample_audio_chunk` - Test audio
- `sample_transcript` - Transcript data
- `mock_openai_client` - Mocked LLM
- `mock_whisper_model` - Mocked Whisper
- `test_audio_file` - Temp audio file

## Writing Tests
```python
@pytest.mark.unit
class TestComponent:
    @pytest.fixture
    def component(self):
        return Component()
    
    def test_feature(self, component):
        # Arrange
        data = setup_data()
        # Act
        result = component.method(data)
        # Assert
        assert result == expected
```

## Documentation
- Full guide: `backend/tests/README.md`
- Summary: `TEST-SUITE-SUMMARY.md`
- Charter: `PARTNERSHIP-CHARTER.md`
