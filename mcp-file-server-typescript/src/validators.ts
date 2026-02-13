import { z } from 'zod';
import { resolve } from 'path';

// Custom validators
const absolutePath = z
  .string()
  .refine((path) => resolve(path) === path, 'Path must be absolute');

const safeFilename = z
  .string()
  .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters');

// Reusable schemas
export const PathSchema = z.object({
  path: absolutePath,
});

export const FileOperationSchema = PathSchema.extend({
  createIfMissing: z.boolean().default(false),
});

export const SearchSchema = z.object({
  directory: absolutePath,
  pattern: z.string().min(1),
  recursive: z.boolean().default(true),
  maxResults: z.number().int().positive().max(1000).default(100),
});

// Export safeFilename for potential external use
export { safeFilename };
