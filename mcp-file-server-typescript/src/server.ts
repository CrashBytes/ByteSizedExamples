#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileTool, writeFileTool, searchFilesTool } from './tools/index.js';
import { Logger, LogLevel } from './utils/logger.js';

export class FileServer {
  private server: Server;
  private logger: Logger;

  constructor() {
    const logLevel =
      process.env.MCP_LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;
    this.logger = new Logger('FileServer', logLevel);

    this.server = new Server(
      {
        name: 'file-operations-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Register tools discovery
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        readFileTool.definition,
        writeFileTool.definition,
        searchFilesTool.definition,
      ],
    }));

    // Handle tool invocations
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info(`Tool invoked: ${name}`, { args });

      try {
        switch (name) {
          case 'read_file':
            return await readFileTool.execute(args);
          case 'write_file':
            return await writeFileTool.execute(args);
          case 'search_files':
            return await searchFilesTool.execute(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, { error });
        throw error;
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('MCP Server Error', { error });
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('File Operations MCP Server running on stdio');
  }
}

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FileServer();
  server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
