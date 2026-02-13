/**
 * Jest Setup - Runs before all tests
 * Injects Chrome API mock into global scope
 */

import chromeMock from './chrome.js';

// Make chrome API available globally for all tests
global.chrome = chromeMock;

// Reset storage before each test
beforeEach(() => {
  chrome.storage.local._reset();
});
