# Contributing to MCP File Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-file-server-typescript.git
   cd mcp-file-server-typescript
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### Code Quality

```bash
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix issues
npm run type-check       # TypeScript compilation check
```

### Building

```bash
npm run build           # Compile TypeScript
```

## Code Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Avoid `any` types when possible
- Export types for public APIs
- Use meaningful variable names

### Testing

- Write tests for all new features
- Maintain 80%+ code coverage
- Unit tests for logic, integration tests for protocols
- Use descriptive test names: `it('should handle missing files gracefully', ...)`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add batch file processing tool
fix: Handle EACCES errors in writeFile
docs: Update QUICKSTART with troubleshooting
test: Add integration tests for search_files
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `npm test`
4. **Update CHANGELOG.md** with your changes
5. **Submit PR** with clear description

### PR Title Format

```
feat: Add new search filters
fix: Resolve path traversal vulnerability
docs: Improve installation instructions
```

## Project Structure

```
src/
├── server.ts          # Main server class
├── config.ts          # Configuration
├── validators.ts      # Zod schemas
├── tools/             # Tool implementations
│   ├── readFile.ts
│   ├── writeFile.ts
│   └── searchFiles.ts
└── utils/             # Utilities
    ├── logger.ts
    └── errors.ts
```

## Adding New Tools

1. Create tool file in `src/tools/`
2. Export from `src/tools/index.ts`
3. Register in `src/server.ts`
4. Add Zod validation schema
5. Write unit tests
6. Update README.md

Example structure:

```typescript
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

const YourToolArgsSchema = z.object({
  // Define parameters
});

export const yourTool = {
  definition: {
    name: 'your_tool',
    description: 'What your tool does',
    inputSchema: {
      // JSON Schema
    },
  } as Tool,

  async execute(args: unknown) {
    const validated = YourToolArgsSchema.parse(args);
    // Implementation
  },
};
```

## Security

- **Never** commit sensitive data (API keys, passwords)
- Validate all inputs with Zod
- Use path validation to prevent directory traversal
- Follow principle of least privilege

## Questions?

- Open an [issue](https://github.com/CrashBytes/mcp-file-server-typescript/issues)
- Check the [tutorial](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025)

Thank you for contributing! 🎉
