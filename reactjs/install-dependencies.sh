#!/bin/bash

# Create necessary directories for Jest mocks
mkdir -p __mocks__

# Install the latest Jest dependencies
npm install --save-dev \
  @jest/globals@latest \
  @testing-library/jest-dom@latest \
  @testing-library/react@latest \
  @testing-library/user-event@latest \
  @types/jest@latest \
  jest@latest \
  jest-environment-jsdom@latest \
  ts-jest@latest \
  identity-obj-proxy@latest

# Run the tests to verify the setup
echo "Running tests to verify the setup..."
npm test