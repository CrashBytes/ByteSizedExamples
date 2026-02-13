import {
  MCPError,
  FileNotFoundError,
  PermissionDeniedError,
  ValidationError,
} from '../../../src/utils/errors.js';

describe('Error Classes', () => {
  describe('MCPError', () => {
    it('should create error with message, code, and details', () => {
      const error = new MCPError('Test error', 'TEST_CODE', { key: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('MCPError');
    });

    it('should create error without details', () => {
      const error = new MCPError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toBeUndefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new MCPError('Test error', 'TEST_CODE', { key: 'value' });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'MCPError',
        message: 'Test error',
        code: 'TEST_CODE',
        details: { key: 'value' },
      });
    });

    it('should have proper stack trace', () => {
      const error = new MCPError('Test error', 'TEST_CODE');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('MCPError');
    });
  });

  describe('FileNotFoundError', () => {
    it('should create error with file path', () => {
      const error = new FileNotFoundError('/test/file.txt');

      expect(error.message).toBe('File not found: /test/file.txt');
      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.details).toEqual({ path: '/test/file.txt' });
      expect(error.name).toBe('FileNotFoundError');
    });

    it('should extend MCPError', () => {
      const error = new FileNotFoundError('/test/file.txt');
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PermissionDeniedError', () => {
    it('should create error with file path', () => {
      const error = new PermissionDeniedError('/restricted/file.txt');

      expect(error.message).toBe('Permission denied accessing: /restricted/file.txt');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.details).toEqual({ path: '/restricted/file.txt' });
      expect(error.name).toBe('PermissionDeniedError');
    });

    it('should extend MCPError', () => {
      const error = new PermissionDeniedError('/restricted/file.txt');
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and details', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'name' });
      expect(error.name).toBe('ValidationError');
    });

    it('should create error without details', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });

    it('should extend MCPError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(MCPError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
