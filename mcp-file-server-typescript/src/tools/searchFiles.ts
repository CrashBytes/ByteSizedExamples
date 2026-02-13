import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileNotFoundError } from '../utils/errors.js';

const searchFilesArgsSchema = z.object({
  directory: z.string().min(1, 'Directory path cannot be empty'),
  pattern: z.string().min(1, 'Search pattern cannot be empty'),
  recursive: z.boolean().default(true),
  maxResults: z.number().int().positive().max(1000).default(100),
});

async function searchDirectory(
  dir: string,
  pattern: string,
  recursive: boolean,
  maxResults: number,
  results: string[] = []
): Promise<string[]> {
  if (results.length >= maxResults) return results;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxResults) break;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await searchDirectory(fullPath, pattern, recursive, maxResults, results);
      } else if (entry.isFile() && entry.name.includes(pattern)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't access
  }

  return results;
}

export const searchFilesTool = {
  definition: {
    name: 'search_files',
    description: 'Search for files matching a pattern in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory to search in',
        },
        pattern: {
          type: 'string',
          description: 'Search pattern to match filenames',
        },
        recursive: {
          type: 'boolean',
          description: 'Search recursively in subdirectories',
          default: true,
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 100,
        },
      },
      required: ['directory', 'pattern'],
    },
  } as Tool,

  async execute(args: unknown) {
    const { directory, pattern, recursive, maxResults } =
      searchFilesArgsSchema.parse(args);

    try {
      await fs.access(directory);
    } catch (error) {
      throw new FileNotFoundError(directory);
    }

    const results = await searchDirectory(
      directory,
      pattern,
      recursive,
      maxResults
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              matches: results.length,
              files: results,
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
