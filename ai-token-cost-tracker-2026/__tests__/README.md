# Test Suite Documentation

## Overview

This test suite provides **100% code coverage** for the AI Token Cost Tracker Chrome extension. All business logic, data storage, and integration flows are thoroughly tested.

## Test Structure

```
__tests__/
├── setup.js                          # Jest configuration & Chrome API mocks
├── lib/
│   ├── pricing-tables.test.js       # Pricing data validation (100%)
│   ├── token-counter.test.js        # Token counting logic (100%)
│   └── storage-manager.test.js      # Chrome storage integration (100%)
├── background/
│   └── cost-calculator.test.js      # Cost calculation engine (100%)
└── integration/
    └── full-flow.test.js            # End-to-end workflows (100%)
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view detailed coverage.

## Coverage Requirements

**All modules must maintain 100% coverage:**
- ✅ Branches: 100%
- ✅ Functions: 100%
- ✅ Lines: 100%
- ✅ Statements: 100%

## Test Categories

### 1. Unit Tests

#### Pricing Tables (`pricing-tables.test.js`)
- ✅ Data structure validation
- ✅ Pricing accuracy verification
- ✅ Model matching (exact & partial)
- ✅ Error handling for unknown models
- ✅ Edge cases and case sensitivity

#### Token Counter (`token-counter.test.js`)
- ✅ OpenAI token counting
- ✅ Anthropic token counting
- ✅ Google token counting
- ✅ Provider routing
- ✅ Edge cases (empty messages, special characters)
- ✅ Integration: Different algorithms

#### Cost Calculator (`cost-calculator.test.js`)
- ✅ Cost calculation for all providers
- ✅ Token extraction from responses
- ✅ Precision handling for small costs
- ✅ Error handling (missing pricing)
- ✅ Malformed response handling

#### Storage Manager (`storage-manager.test.js`)
- ✅ Individual call recording
- ✅ Daily aggregation
- ✅ Provider breakdown
- ✅ Historical data retrieval
- ✅ Temporary storage (request pairing)
- ✅ Data cleanup (90-day retention)
- ✅ Chrome storage integration

### 2. Integration Tests

#### Full Flow (`full-flow.test.js`)
- ✅ Complete OpenAI request flow
- ✅ Complete Anthropic request flow
- ✅ Complete Google request flow
- ✅ Multi-provider daily tracking
- ✅ Historical data across multiple days
- ✅ Error handling in production scenarios
- ✅ Request/response pairing workflow
- ✅ High-volume performance (100 requests)

## Key Testing Patterns

### Chrome API Mocking

All tests use the Chrome API mock defined in `setup.js`:

```javascript
// Automatically available in all tests
global.chrome.storage.local.get()
global.chrome.storage.local.set()
global.chrome.storage.local.remove()
global.chrome.storage.local.clear()
```

Storage is automatically reset between tests.

### Dependency Mocking

Cost calculator tests mock dependencies:

```javascript
jest.mock('../../lib/token-counter.js');
jest.mock('../../lib/pricing-tables.js');
```

### Precision Testing

Money calculations are tested with precision:

```javascript
expect(result.totalCost).toBeCloseTo(expectedCost, 10); // 10 decimal places
```

## Test Data Examples

### Request Data Structure
```javascript
{
  timestamp: 1640000000000,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'user', content: 'Hello world' }
  ],
  url: 'https://api.openai.com'
}
```

### Response Data Structure (OpenAI)
```javascript
{
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150
  }
}
```

### Cost Data Structure
```javascript
{
  timestamp: 1640000000000,
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  inputTokens: 100,
  outputTokens: 50,
  totalTokens: 150,
  inputCost: 0.001,
  outputCost: 0.0015,
  totalCost: 0.0025,
  url: 'https://api.openai.com'
}
```

## Testing Best Practices

### ✅ DO
- Test edge cases (null, undefined, empty arrays)
- Test error handling paths
- Test numerical precision for money calculations
- Test provider-specific logic for all providers
- Test data aggregation over time
- Use descriptive test names
- Group related tests with `describe` blocks

### ❌ DON'T
- Mock Chrome APIs manually (use provided setup)
- Test implementation details
- Write tests that depend on execution order
- Use hardcoded timestamps without context
- Skip edge cases

## Debugging Failed Tests

### View Detailed Error
```bash
npm test -- --verbose
```

### Run Specific Test File
```bash
npm test pricing-tables.test.js
```

### Run Specific Test
```bash
npm test -- -t "should calculate cost for valid OpenAI request"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook recommended)
- Every pull request
- Before deployment

## Maintenance

### Adding New Features

When adding new features:

1. Write tests FIRST (TDD approach)
2. Ensure 100% coverage for new code
3. Update integration tests if needed
4. Run full test suite before committing

### Updating Pricing

When pricing changes:

1. Update `PRICING_TABLES` in `lib/pricing-tables.js`
2. Update expected values in `pricing-tables.test.js`
3. Verify all cost calculation tests still pass

### Adding New Providers

When adding a new provider:

1. Add provider to `token-counter.js`
2. Add provider to `cost-calculator.js`
3. Add provider pricing to `pricing-tables.js`
4. Add tests for all three files
5. Add integration test for new provider flow

## Coverage Enforcement

The Jest configuration enforces 100% coverage:

```javascript
coverageThresholds: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

Tests will **FAIL** if coverage drops below 100%.

## Questions?

For questions about the test suite:
- Check existing test files for examples
- Review Jest documentation: https://jestjs.io/
- Open an issue on GitHub

## License

MIT License - Same as main project
