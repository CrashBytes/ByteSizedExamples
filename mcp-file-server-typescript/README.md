# File Operations MCP Server

Production-grade MCP server providing file system operations for Claude Desktop and compatible LLM clients.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-green)](https://nodejs.org/)

Part of the **CrashBytes Production MCP Tutorial Series**. See the [full tutorial](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025) for implementation details.

## Features

- **Read files**: Access file contents with configurable encoding (UTF-8, Base64)
- **Write files**: Create or update files with atomic writes and directory creation
- **Search files**: Glob-based file search with configurable depth and pattern matching
- **Production-ready**: Comprehensive error handling, validation, logging, and testing
- **Type-safe**: Full TypeScript implementation with strict mode
- **Well-tested**: 80%+ code coverage with unit and integration tests

## Installation

### Global Installation (Recommended for Claude Desktop)

```bash
npm install -g @crashbytes/mcp-file-server-typescript
```

### Local Installation

```bash
npm install @crashbytes/mcp-file-server-typescript
```

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_ALLOWED_PATHS` | Comma-separated list of allowed directories | All paths |
| `MCP_MAX_FILE_SIZE` | Maximum file size in bytes | 10MB |
| `MCP_LOG_LEVEL` | Logging level (DEBUG, INFO, WARN, ERROR) | INFO |
| `MCP_BLOCKED_EXTENSIONS` | Comma-separated list of blocked file extensions | .exe,.dll |

## Usage

### Claude Desktop Integration

Add to Claude Desktop's MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "file-operations": {
      "command": "mcp-file-server",
      "env": {
        "MCP_ALLOWED_PATHS": "/Users/yourname/Documents,/Users/yourname/Projects",
        "MCP_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

Restart Claude Desktop to load the server.

### Programmatic Usage

```typescript
import { FileServer } from '@crashbytes/mcp-file-server-typescript';

const server = new FileServer();
await server.start();
```

## Available Tools

### read_file

Read file contents with configurable encoding.

```typescript
{
  "name": "read_file",
  "arguments": {
    "path": "/path/to/file.txt",
    "encoding": "utf-8"  // or "base64"
  }
}
```

### write_file

Write content to a file.

```typescript
{
  "name": "write_file",
  "arguments": {
    "path": "/path/to/file.txt",
    "content": "Hello, World!",
    "encoding": "utf-8",
    "createDirectories": true
  }
}
```

### search_files

Search for files matching a pattern.

```typescript
{
  "name": "search_files",
  "arguments": {
    "directory": "/path/to/search",
    "pattern": "*.ts",
    "recursive": true,
    "maxResults": 100
  }
}
```

## Security

- **Path validation**: Prevents directory traversal attacks
- **Allowed paths**: Configurable whitelist restricts file system access
- **File size limits**: Prevents resource exhaustion
- **Extension blocking**: Blocks dangerous file types by default
- **Input validation**: Zod schemas validate all tool inputs

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Setup

```bash
git clone https://github.com/CrashBytes/mcp-file-server-typescript.git
cd mcp-file-server-typescript
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Development Mode

```bash
npm run dev
```

### Lint

```bash
npm run lint            # Check for issues
npm run lint:fix        # Fix auto-fixable issues
```

## Project Structure

```
mcp-file-server-typescript/
├── src/
│   ├── server.ts           # Main server implementation
│   ├── config.ts           # Configuration management
│   ├── validators.ts       # Zod validation schemas
│   ├── tools/              # Tool implementations
│   │   ├── readFile.ts
│   │   ├── writeFile.ts
│   │   └── searchFiles.ts
│   └── utils/              # Utilities
│       ├── logger.ts       # Structured logging
│       └── errors.ts       # Custom error types
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

The project includes comprehensive test coverage:

- **Unit tests**: Test individual tool implementations with mocked dependencies
- **Integration tests**: Test full MCP protocol implementation
- **Coverage target**: 80% minimum across branches, functions, lines, and statements

Run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

### Docker

```bash
docker build -t mcp-file-server .
docker run -i mcp-file-server
```

### NPM Package

Published to npm for easy installation:

```bash
npm install -g @crashbytes/mcp-file-server-typescript
```

## Documentation

Full API documentation is available via TypeDoc:

```bash
npm run docs
```

Documentation will be generated in the `docs/` directory.

## Tutorial

This repository accompanies the **Building Production MCP Servers** tutorial on CrashBytes. The tutorial covers:

- MCP protocol architecture and design patterns
- TypeScript implementation with strict type safety
- Zod validation for runtime type checking
- Comprehensive error handling strategies
- Testing approaches (unit and integration)
- Security considerations for production
- Deployment patterns and CI/CD
- Performance optimization techniques
- Monitoring and observability

Read the full tutorial: [tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Official Model Context Protocol SDK
- [Claude Desktop](https://claude.ai/download) - Claude desktop application with MCP support

## Support

- 📖 [Tutorial](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025)
- 🐛 [Issues](https://github.com/CrashBytes/mcp-file-server-typescript/issues)
- 💬 [Discussions](https://github.com/CrashBytes/mcp-file-server-typescript/discussions)

---

**Built with ❤️ by [CrashBytes](https://crashbytes.com)** | Production AI Engineering Tutorials
