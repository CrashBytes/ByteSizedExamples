import { z } from 'zod';
import { promises as fs } from 'fs';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileNotFoundError, PermissionDeniedError } from '../utils/errors.js';

// Validation schema
const readFileArgsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
});

export const readFileTool = {
  definition: {
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file',
        },
        encoding: {
          type: 'string',
          enum: ['utf-8', 'base64'],
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path'],
    },
  } as Tool,

  async execute(args: unknown) {
    // Validate inputs
    const { path, encoding } = readFileArgsSchema.parse(args);

    try {
      const content = await fs.readFile(path, encoding);

      return {
        content: [
          {
            type: 'text',
            text: content.toString(),
          },
        ],
      };
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'ENOENT') {
        throw new FileNotFoundError(path);
      }
      if (err.code === 'EACCES') {
        throw new PermissionDeniedError(path);
      }
      throw error;
    }
  },
};
