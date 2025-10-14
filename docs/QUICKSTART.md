# Sunsama MCP Server - Quick Start Guide

Get up and running with the Sunsama MCP server in under 5 minutes.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm** or **bun**: Package manager
- **Sunsama Account**: Active subscription with email/password credentials
- **MCP Client**: Claude Desktop, Cursor, or compatible MCP client

## Installation

### 1. Clone or Install

```bash
# Option A: Clone repository
git clone https://github.com/yourusername/sunsama-mcp.git
cd sunsama-mcp

# Option B: Install from npm (when published)
npm install -g sunsama-mcp
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using bun
bun install
```

### 3. Build Project

```bash
# Option A: Using npm (requires bunx from bun)
npm run build

# Option B: Direct TypeScript compilation (works everywhere)
npx tsc
chmod +x dist/main.js

# Option C: Using bun
bun run build
```

**Verify build**: Check that `dist/` directory contains compiled JavaScript files.

**Note**: If `npm run build` fails with "bunx: command not found", use Option B (`npx tsc`).

## Configuration

### Stdio Transport (Recommended)

**For Claude Desktop**:

1. Edit Claude Desktop config file:

```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
code ~/.config/Claude/claude_desktop_config.json

# Windows
code %APPDATA%\Claude\claude_desktop_config.json
```

2. Add Sunsama server configuration:

```json
{
  "mcpServers": {
    "sunsama": {
      "command": "node",
      "args": ["/absolute/path/to/sunsama-mcp/dist/main.js"],
      "env": {
        "SUNSAMA_EMAIL": "your.email@example.com",
        "SUNSAMA_PASSWORD": "your-password-here"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/sunsama-mcp` with your actual project path.

3. Restart Claude Desktop

**For Cursor**:

1. Open Cursor Settings → Features → MCP
2. Click "Add MCP Server"
3. Configure:
   - **Name**: Sunsama
   - **Command**: `node`
   - **Args**: `/absolute/path/to/sunsama-mcp/dist/main.js`
   - **Environment Variables**:
     - `SUNSAMA_EMAIL`: your email
     - `SUNSAMA_PASSWORD`: your password
4. Save and restart Cursor

### HTTP Transport (Advanced)

**Use case**: When you need session persistence or HTTP access

1. Set environment variable:

```bash
export TRANSPORT_TYPE=http
export HTTP_PORT=3099  # Optional, defaults to 3099
```

2. Start server:

```bash
node dist/main.js
```

3. Connect MCP client:

```json
{
  "mcpServers": {
    "sunsama": {
      "url": "http://localhost:3099/sse",
      "transport": "http"
    }
  }
}
```

4. Authenticate with HTTP Basic Auth:
   - Username: your Sunsama email
   - Password: your Sunsama password

## Verification

### Test Server Startup

**Stdio mode**:
```bash
SUNSAMA_EMAIL="your@email.com" SUNSAMA_PASSWORD="yourpass" node dist/main.js
```

**Expected output**: No errors, server starts silently (stdio waits for MCP protocol input)

**HTTP mode**:
```bash
TRANSPORT_TYPE=http HTTP_PORT=3099 node dist/main.js
```

**Expected output**:
```
[HTTP Transport] Starting SSE server on port 3099...
[HTTP Transport] Server listening on http://localhost:3099
[Client Cache] Started periodic cleanup
```

### Test MCP Tools

Open Claude Desktop or Cursor and try these commands:

1. **Get today's tasks**:
   ```
   Can you show me what tasks I have scheduled for today using Sunsama?
   ```

2. **Create a test task**:
   ```
   Create a task in Sunsama for tomorrow called "Test MCP integration"
   ```

3. **Get user info**:
   ```
   What's my Sunsama user profile and timezone?
   ```

**Expected**: Server responds with TSV-formatted data (no errors)

## Troubleshooting

### Error: "Sunsama credentials not configured"

**Cause**: Missing `SUNSAMA_EMAIL` or `SUNSAMA_PASSWORD` environment variables

**Fix**:
```bash
# Check environment variables
echo $SUNSAMA_EMAIL
echo $SUNSAMA_PASSWORD

# For Claude Desktop: Check claude_desktop_config.json has correct env vars
# For Cursor: Check MCP server settings have env vars configured
```

### Error: "Authentication failed"

**Cause**: Invalid Sunsama credentials or account issue

**Fix**:
1. Verify credentials work in Sunsama web app (https://app.sunsama.com)
2. Check for typos in email/password
3. Ensure password doesn't contain special shell characters (escape if needed)
4. Try resetting Sunsama password if persistent

### Error: "ECONNREFUSED" (HTTP mode)

**Cause**: Server not running or wrong port

**Fix**:
```bash
# Check server is running
ps aux | grep "node.*main.js"

# Check port is correct
lsof -i :3099  # Should show node process

# Restart server
TRANSPORT_TYPE=http node dist/main.js
```

### Error: "Module not found"

**Cause**: Missing dependencies or incorrect build

**Fix**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Verify dist/ exists and contains .js files
ls -la dist/
```

### Error: "Cannot find module 'sunsama-api'"

**Cause**: Missing `sunsama-api` dependency

**Fix**:
```bash
npm install sunsama-api
npm run build
```

### MCP Client Not Showing Tools

**Symptoms**: Claude/Cursor doesn't suggest Sunsama tools

**Fix**:
1. **Restart MCP client** (very important!)
2. Check server logs for startup errors
3. Verify config file path is correct
4. Check absolute paths (no relative paths like `./dist/main.js`)
5. Try HTTP mode for better debugging (logs to console)

## Security Best Practices

### Environment Variable Security

**❌ Never commit credentials to git**:
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "claude_desktop_config.json" >> .gitignore
```

**✅ Use secure credential storage**:

**Option 1: direnv (Recommended)**
```bash
# Install direnv
# macOS: brew install direnv
# Linux: apt-get install direnv

# Create .envrc
echo 'export SUNSAMA_EMAIL="your@email.com"' > .envrc
echo 'export SUNSAMA_PASSWORD="yourpass"' >> .envrc

# Allow direnv
direnv allow

# Credentials auto-loaded when you cd into directory
```

**Option 2: System Keychain (Advanced)**
```bash
# macOS: Use macOS Keychain
security add-generic-password -a sunsama -s sunsama-mcp -w "yourpass"

# Retrieve in script
SUNSAMA_PASSWORD=$(security find-generic-password -a sunsama -s sunsama-mcp -w)
```

**Option 3: MCP Client Credentials (Best)**
- Let Claude Desktop/Cursor manage credentials
- Stored in their secure credential stores
- No plaintext environment variables

## Available Tools

The server provides 16 MCP tools:

### User Operations
- `get-user` - Get user profile and timezone

### Task Retrieval
- `get-tasks-by-day` - Get tasks for specific day
- `get-tasks-backlog` - Get backlog tasks
- `get-archived-tasks` - Get archived tasks by date range
- `get-task-by-id` - Get single task details

### Task Mutations
- `create-task` - Create new task
- `update-task-complete` - Mark task complete
- `update-task-snooze-date` - Reschedule task
- `update-task-backlog` - Move task to backlog
- `update-task-planned-time` - Update time estimate
- `update-task-notes` - Update task notes
- `update-task-due-date` - Update due date
- `update-task-text` - Update task title
- `update-task-stream` - Assign task to channel
- `delete-task` - Delete task

### Stream Operations
- `get-streams` - Get available channels/streams

See [COVERAGE_MATRIX.md](../docs/COVERAGE_MATRIX.md) for detailed tool documentation.

## Performance Tips

### Cache Optimization

The server uses aggressive caching for performance:

- **Tasks**: 30s TTL (real-time updates)
- **User/Streams**: 5min TTL (rarely change)
- **Archived tasks**: 10min TTL (historical data)

**Cache automatically invalidates** on write operations (create/update/delete).

### Response Trimming

Most mutation tools accept `limitResponsePayload` parameter:

```json
{
  "name": "update-task-complete",
  "arguments": {
    "taskId": "task_abc123",
    "limitResponsePayload": true  // Reduces response size by 30-50%
  }
}
```

**Benefit**: Faster response times, less MCP protocol overhead

## Next Steps

### Learn More

- **[README.md](../README.md)** - Full project documentation
- **[COVERAGE_MATRIX.md](../docs/COVERAGE_MATRIX.md)** - API coverage details
- **[API_DISCOVERY.md](../docs/API_DISCOVERY.md)** - How endpoints were discovered
- **[endpoints/](../docs/endpoints/)** - Per-endpoint examples

### Development

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** *(TODO)* - Contribution guidelines
- **[Architecture docs](../README.md#architecture)** - System architecture
- **[Testing](../README.md#testing)** - Running tests

### Support

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share use cases
- **Discord**: Join community (link in README)

## Common Use Cases

### Daily Planning Workflow

```
User: "What's on my schedule today?"
→ Uses: get-tasks-by-day

User: "Create a task for tomorrow: Review Q4 budget, 2 hours"
→ Uses: create-task

User: "Mark the standup meeting as complete"
→ Uses: get-tasks-by-day (to find task) + update-task-complete
```

### Backlog Management

```
User: "Show my backlog"
→ Uses: get-tasks-backlog

User: "Schedule 'Research project management tools' for next Tuesday"
→ Uses: get-tasks-backlog (to find task) + update-task-snooze-date
```

### Time Tracking

```
User: "Set time estimate for budget review to 90 minutes"
→ Uses: update-task-planned-time

User: "How much time did I plan for today?"
→ Uses: get-tasks-by-day (calculates total time estimates)
```

## Advanced Configuration

### Custom Cache TTL

Edit `src/config/cache-config.ts`:

```typescript
export const CACHE_CONFIG = {
  TASK_CACHE_TTL_MS: 30 * 1000,        // 30 seconds
  USER_CACHE_TTL_MS: 5 * 60 * 1000,    // 5 minutes
  STREAM_CACHE_TTL_MS: 5 * 60 * 1000,  // 5 minutes
};
```

Rebuild after changes: `npm run build`

### Custom Session Timeout (HTTP mode)

Edit `src/config/session-config.ts`:

```typescript
export const SESSION_CONFIG = {
  CLIENT_IDLE_TIMEOUT: 30 * 60 * 1000,  // 30 minutes
  CLIENT_MAX_LIFETIME: 2 * 60 * 60 * 1000,  // 2 hours
  CLEANUP_INTERVAL: 5 * 60 * 1000,  // 5 minutes
};
```

### Development Mode

Run without building:

```bash
# Install tsx for TypeScript execution
npm install -g tsx

# Run directly
SUNSAMA_EMAIL="your@email.com" SUNSAMA_PASSWORD="yourpass" tsx src/main.ts
```

## FAQs

**Q: Does this work with Sunsama's free trial?**
A: Yes, as long as you have valid email/password credentials.

**Q: Can I use this with multiple Sunsama accounts?**
A: HTTP mode supports multi-user (different credentials per request). Stdio mode is single-user.

**Q: Will this break if Sunsama updates their API?**
A: Possibly. The server detects schema changes and logs warnings. See [API_CHANGELOG.md](../docs/API_CHANGELOG.md) for known changes.

**Q: Can I use this in production?**
A: Yes, but be aware this uses Sunsama's undocumented API. No official support or SLA.

**Q: How do I update to latest version?**
A: `git pull && npm install && npm run build` (if from git)

**Q: Can I deploy this to a server?**
A: Yes, HTTP mode supports remote deployment. Use HTTPS + authentication proxy for security.

## Support & Community

- **Report bugs**: [GitHub Issues](https://github.com/yourusername/sunsama-mcp/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/yourusername/sunsama-mcp/discussions)
- **Questions**: [Discord](https://discord.gg/yourserver) *(TODO)*

---

**Last Updated**: 2025-10-12
**Version**: 0.15.4
**License**: MIT
