const { greet, calculateSum, validateEmail } = require('../src/utils');
const { healthCheck, getStatus } = require('../src/api');

describe('Utils', () => {
  describe('greet', () => {
    it('should return greeting with name', () => {
      expect(greet('World')).toBe('Hello, World!');
    });

    it('should handle empty string', () => {
      expect(greet('')).toBe('Hello, !');
    });
  });

  describe('calculateSum', () => {
    it('should sum array of numbers', () => {
      expect(calculateSum([1, 2, 3])).toBe(6);
    });

    it('should return 0 for empty array', () => {
      expect(calculateSum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(calculateSum([-1, 1])).toBe(0);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('test@')).toBe(false);
    });
  });
});

describe('API', () => {
  describe('healthCheck', () => {
    it('should return healthy status', () => {
      const result = healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const result = getStatus();
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
