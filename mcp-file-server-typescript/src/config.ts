import { z } from 'zod';

const ConfigSchema = z.object({
  server: z.object({
    name: z.string().default('file-operations-server'),
    version: z.string().default('1.0.0'),
  }),
  filesystem: z.object({
    allowedPaths: z.array(z.string()).default([]),
    maxFileSize: z
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024), // 10MB
    blockedExtensions: z.array(z.string()).default(['.exe', '.dll']),
  }),
  logging: z.object({
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
    pretty: z.boolean().default(false),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const envConfig = {
    server: {
      name: process.env.MCP_SERVER_NAME,
      version: process.env.MCP_SERVER_VERSION,
    },
    filesystem: {
      allowedPaths: process.env.MCP_ALLOWED_PATHS?.split(','),
      maxFileSize: process.env.MCP_MAX_FILE_SIZE
        ? parseInt(process.env.MCP_MAX_FILE_SIZE)
        : undefined,
      blockedExtensions: process.env.MCP_BLOCKED_EXTENSIONS?.split(','),
    },
    logging: {
      level: process.env.MCP_LOG_LEVEL,
      pretty: process.env.MCP_LOG_PRETTY === 'true',
    },
  };

  return ConfigSchema.parse(envConfig);
}
