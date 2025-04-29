// Use require instead of import for Jest
require('@testing-library/jest-dom');

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
