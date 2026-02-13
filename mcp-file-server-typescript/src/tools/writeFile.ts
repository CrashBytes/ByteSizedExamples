import { z } from 'zod';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PermissionDeniedError } from '../utils/errors.js';

// Validation schema
const writeFileArgsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  content: z.string(),
  encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
  createDirectories: z.boolean().default(false),
});

export const writeFileTool = {
  definition: {
    name: 'write_file',
    description: 'Write content to a file on the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute or relative path to the file',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
        encoding: {
          type: 'string',
          enum: ['utf-8', 'base64'],
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
        createDirectories: {
          type: 'boolean',
          description: 'Create parent directories if they do not exist',
          default: false,
        },
      },
      required: ['path', 'content'],
    },
  } as Tool,

  async execute(args: unknown) {
    const { path, content, encoding, createDirectories } =
      writeFileArgsSchema.parse(args);

    try {
      if (createDirectories) {
        await fs.mkdir(dirname(path), { recursive: true });
      }

      await fs.writeFile(path, content, encoding);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote ${content.length} bytes to ${path}`,
          },
        ],
      };
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'EACCES') {
        throw new PermissionDeniedError(path);
      }
      throw error;
    }
  },
};
