import { readFileTool } from '../../../src/tools/readFile.js';
import { promises as fs } from 'fs';
import { FileNotFoundError, PermissionDeniedError } from '../../../src/utils/errors.js';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('readFileTool', () => {
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should read file successfully with utf-8 encoding', async () => {
      const mockContent = 'Hello, World!';
      mockReadFile.mockResolvedValue(Buffer.from(mockContent));

      const result = await readFileTool.execute({
        path: '/test/file.txt',
        encoding: 'utf-8',
      });

      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
      expect(result.content[0].text).toBe(mockContent);
    });

    it('should read file with base64 encoding', async () => {
      const mockContent = 'Hello, World!';
      mockReadFile.mockResolvedValue(Buffer.from(mockContent));

      const result = await readFileTool.execute({
        path: '/test/binary.dat',
        encoding: 'base64',
      });

      expect(mockReadFile).toHaveBeenCalledWith('/test/binary.dat', 'base64');
      expect(result.content[0].text).toBeDefined();
    });

    it('should throw FileNotFoundError for missing files', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      await expect(
        readFileTool.execute({ path: '/missing/file.txt' })
      ).rejects.toThrow(FileNotFoundError);
    });

    it('should throw PermissionDeniedError for access denied', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockReadFile.mockRejectedValue(error);

      await expect(
        readFileTool.execute({ path: '/restricted/file.txt' })
      ).rejects.toThrow(PermissionDeniedError);
    });

    it('should rethrow other errors unchanged', async () => {
      const error = new Error('Unknown error');
      mockReadFile.mockRejectedValue(error);

      await expect(
        readFileTool.execute({ path: '/test/file.txt' })
      ).rejects.toThrow('Unknown error');
    });

    it('should reject invalid arguments', async () => {
      await expect(readFileTool.execute({ path: '' })).rejects.toThrow(
        'Path cannot be empty'
      );
    });

    it('should default to utf-8 encoding', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      await readFileTool.execute({ path: '/test.txt' });

      expect(mockReadFile).toHaveBeenCalledWith('/test.txt', 'utf-8');
    });

    it('should reject invalid encoding', async () => {
      await expect(
        readFileTool.execute({ path: '/test.txt', encoding: 'invalid' })
      ).rejects.toThrow();
    });
  });
});
