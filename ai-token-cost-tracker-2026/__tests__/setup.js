/**
 * Jest setup file - runs before all tests
 * Sets up global mocks and test environment
 */

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      // In-memory storage for tests
      _data: {},
      
      async get(keys) {
        if (keys === null) {
          // Get all storage
          return { ...this._data };
        }
        
        if (typeof keys === 'string') {
          // Single key
          return { [keys]: this._data[keys] };
        }
        
        if (Array.isArray(keys)) {
          // Multiple keys
          const result = {};
          for (const key of keys) {
            if (key in this._data) {
              result[key] = this._data[key];
            }
          }
          return result;
        }
        
        return {};
      },
      
      async set(items) {
        Object.assign(this._data, items);
        return;
      },
      
      async remove(keys) {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keysArray) {
          delete this._data[key];
        }
        return;
      },
      
      async clear() {
        this._data = {};
        return;
      },
      
      // Helper for tests to reset storage
      _reset() {
        this._data = {};
      }
    }
  }
};

// Reset storage before each test
beforeEach(() => {
  global.chrome.storage.local._reset();
});
