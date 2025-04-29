#!/bin/bash

# Create mocks directory if it doesn't exist
mkdir -p __mocks__

# Copy mock files to the mocks directory
cat > __mocks__/fileMock.js << 'EOF'
module.exports = 'test-file-stub';
EOF

cat > __mocks__/styleMock.js << 'EOF'
module.exports = {};
EOF

# Create a proper jest.setup.js file
cat > jest.setup.js << 'EOF'
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
EOF

echo "Test environment setup completed. Try running your tests with 'yarn test' or 'npm test'."