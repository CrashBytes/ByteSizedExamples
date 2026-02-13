/**
 * Chrome API Mock for Testing
 * Simulates chrome.storage.local API behavior
 */

class ChromeStorageMock {
  constructor() {
    this.store = {};
  }

  async get(keys) {
    if (keys === null) {
      // Return all stored data
      return { ...this.store };
    }

    if (typeof keys === 'string') {
      // Single key
      return { [keys]: this.store[keys] };
    }

    if (Array.isArray(keys)) {
      // Multiple keys
      const result = {};
      keys.forEach(key => {
        if (key in this.store) {
          result[key] = this.store[key];
        }
      });
      return result;
    }

    return {};
  }

  async set(items) {
    Object.assign(this.store, items);
    return Promise.resolve();
  }

  async remove(keys) {
    if (typeof keys === 'string') {
      delete this.store[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach(key => delete this.store[key]);
    }
    return Promise.resolve();
  }

  async clear() {
    this.store = {};
    return Promise.resolve();
  }

  // Helper for testing - get raw store
  _getStore() {
    return this.store;
  }

  // Helper for testing - reset store
  _reset() {
    this.store = {};
  }
}

// Create mock Chrome API
const chromeMock = {
  storage: {
    local: new ChromeStorageMock(),
  },
};

// Export for use in tests
export default chromeMock;
