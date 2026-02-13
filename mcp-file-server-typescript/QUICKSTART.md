# Quick Start Guide

Get the MCP File Server running in 5 minutes.

## Installation

```bash
npm install -g @crashbytes/mcp-file-server-typescript
```

## Claude Desktop Setup

1. **Locate your Claude Desktop config file**:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`

2. **Add the MCP server**:

```json
{
  "mcpServers": {
    "file-operations": {
      "command": "mcp-file-server",
      "env": {
        "MCP_ALLOWED_PATHS": "/Users/yourname/Documents",
        "MCP_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

## Test It

Ask Claude:

> "Read the contents of my package.json file"

Claude will use the `read_file` tool to access the file.

## Available Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `read_file` | Read file contents | Read README.md |
| `write_file` | Write to file | Create notes.txt |
| `search_files` | Find files | Search for "*.ts" files |

## Security

By default, the server allows access to **all** paths. Use `MCP_ALLOWED_PATHS` to restrict access:

```json
{
  "env": {
    "MCP_ALLOWED_PATHS": "/Users/yourname/Documents,/Users/yourname/Projects"
  }
}
```

## Troubleshooting

### Server not starting?

1. Check Claude Desktop console for errors
2. Verify `mcp-file-server` is in your PATH: `which mcp-file-server`
3. Enable debug logging: `"MCP_LOG_LEVEL": "DEBUG"`

### Permission denied?

1. Check `MCP_ALLOWED_PATHS` includes the directory
2. Verify file permissions: `ls -la /path/to/file`

### Tools not showing up?

1. Restart Claude Desktop completely (quit and reopen)
2. Check config file syntax (valid JSON)
3. Verify MCP server appears in Claude Desktop's settings

## Next Steps

- Read the [full tutorial](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025)
- Explore the [source code](https://github.com/CrashBytes/mcp-file-server-typescript)
- Build your own MCP tools

## Support

- [GitHub Issues](https://github.com/CrashBytes/mcp-file-server-typescript/issues)
- [Tutorial](https://tutorials.crashbytes.com/building-production-mcp-servers-typescript-claude-2025)
