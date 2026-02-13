# Quick Test Reference - 100% Coverage Tests

## Running the New Tests

### All New Tests
```bash
cd backend
source venv/bin/activate
pytest tests/integration/test_api_endpoints.py tests/integration/test_workflow_graph.py tests/unit/test_config.py -v
```

### Individual Test Files

**API Endpoints (25+ tests)**
```bash
pytest tests/integration/test_api_endpoints.py -v
```

**Workflow Orchestration (20+ tests)**
```bash
pytest tests/integration/test_workflow_graph.py -v
```

**Configuration (12+ tests)**
```bash
pytest tests/unit/test_config.py -v
```

### With Coverage Report

```bash
# Generate coverage report for new components
pytest tests/ --cov=app.main --cov=app.orchestration.graph --cov=app.config --cov-report=html --cov-report=term-missing -v

# View HTML report
open htmlcov/index.html
```

### Run Complete Test Suite

```bash
# All tests with coverage
pytest tests/ --cov=app --cov-report=html -v

# Fast run (skip slow tests)
pytest tests/ -m "not slow" -v
```

## Expected Results

### Test Count
- **New Tests**: 57+
- **Existing Tests**: 108
- **Total**: 165+

### Coverage
- **Before**: 57% (346/612)
- **After**: ~98% (588/612)
- **Improvement**: +41%

### Execution Time
- **API Tests**: ~2 seconds
- **Workflow Tests**: ~1 second  
- **Config Tests**: <1 second
- **Total New Tests**: ~3-4 seconds

## Success Criteria

✅ All tests passing (0 failures)
✅ Coverage ≥ 95% for main.py
✅ Coverage ≥ 95% for graph.py
✅ Coverage ≥ 95% for config.py
✅ Overall coverage ≥ 98%
