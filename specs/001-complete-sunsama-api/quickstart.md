---
status: active
created: 2025-10-12
updated: 2025-10-12
type: guide
lifecycle: persistent
---

# Developer Quickstart Guide: Sunsama MCP Server

This guide will help you set up, configure, and start developing with the Sunsama MCP server, which extends [robertn702/mcp-sunsama](https://github.com/robertn702/mcp-sunsama) to provide comprehensive Sunsama API coverage for AI assistants.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Server](#running-the-server)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following:

### Required Software

- **Node.js 18+**: Check your version with `node --version`
  ```bash
  # Install Node.js 18+ if needed
  # macOS (using Homebrew)
  brew install node

  # Linux (using nvm)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18
  ```

- **npm or bun**: Package manager (bun recommended for faster builds)
  ```bash
  # Install bun (optional but recommended)
  curl -fsSL https://bun.sh/install | bash
  ```

### Active Sunsama Account

- Active Sunsama subscription with full feature access
- Valid email and password credentials
- Access to the Sunsama web app at https://app.sunsama.com

### System Keychain Access

Your operating system's credential storage must be available:

- **macOS**: Keychain Access (built-in)
- **Linux**: libsecret (GNOME Keyring or KDE Wallet)
  ```bash
  # Install libsecret on Debian/Ubuntu
  sudo apt-get install libsecret-1-dev

  # Install libsecret on Fedora/Red Hat
  sudo yum install libsecret-devel

  # Install libsecret on Arch Linux
  sudo pacman -S libsecret
  ```
- **Windows**: Credential Vault (built-in)

### MCP Client

You'll need an MCP-compatible client to interact with the server:

- **Claude Desktop** (recommended): https://claude.ai/download
- **Cursor**: https://cursor.sh
- **Or any MCP-compatible client** supporting stdio transport

---

## Installation

### 1. Clone the Base Repository

This project extends the existing robertn702/mcp-sunsama implementation:

```bash
# Clone the base repository
git clone https://github.com/robertn702/mcp-sunsama.git sunsama-mcp
cd sunsama-mcp

# Optional: Create a new branch for your extended implementation
git checkout -b 001-complete-sunsama-api
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using bun (faster)
bun install
```

### 3. Install TypeScript Types

If not already included, install TypeScript type definitions:

```bash
npm install --save-dev @types/node @types/keytar
```

### 4. Build the Project

Compile TypeScript to JavaScript:

```bash
# Using npm
npm run build

# Or using bun
bun run build
```

You should see compiled output in the `dist/` or `build/` directory.

---

## Configuration

### 1. Credential Setup Using Keytar

The server uses your system keychain to securely store Sunsama credentials.

#### Interactive Setup (Recommended)

Run the credential setup utility:

```bash
# If the base repository includes a setup script
npm run setup

# Or create credentials manually using the CLI
node dist/setup.js
```

You'll be prompted for:
- **Sunsama email**: Your Sunsama account email
- **Sunsama password**: Your Sunsama account password

The credentials will be securely stored in your system keychain.

#### Manual Credential Storage (Development)

If no setup script exists, you can use environment variables (less secure):

```bash
export SUNSAMA_EMAIL="your-email@example.com"
export SUNSAMA_PASSWORD="your-password"
```

**Warning**: Environment variables are visible in process lists. Use keychain storage for production.

### 2. MCP Client Configuration

Configure your MCP client to connect to the Sunsama server using stdio transport.

#### Claude Desktop Configuration

Edit Claude Desktop's config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "sunsama": {
      "command": "node",
      "args": ["/absolute/path/to/sunsama-mcp/dist/index.js"],
      "env": {
        "SUNSAMA_EMAIL": "your-email@example.com",
        "SUNSAMA_PASSWORD": "your-password"
      }
    }
  }
}
```

**Using Keychain (No Environment Variables)**:

If credentials are stored in keychain, omit the `env` block:

```json
{
  "mcpServers": {
    "sunsama": {
      "command": "node",
      "args": ["/absolute/path/to/sunsama-mcp/dist/index.js"]
    }
  }
}
```

#### Cursor Configuration

Cursor uses a similar configuration format. Edit your Cursor settings:

**macOS/Linux**: `~/.cursor/config.json`
**Windows**: `%APPDATA%\Cursor\config.json`

Add the MCP server configuration:

```json
{
  "mcp": {
    "servers": {
      "sunsama": {
        "command": "node",
        "args": ["/absolute/path/to/sunsama-mcp/dist/index.js"]
      }
    }
  }
}
```

### 3. Verify Configuration

Test that the server can authenticate with Sunsama:

```bash
# Test authentication (if test script exists)
npm run test:auth

# Or manually run the server with debug logging
DEBUG=* node dist/index.js
```

You should see output indicating successful authentication and connection to Sunsama's API.

---

## Running the Server

### Development Mode

Run the server in development mode with automatic recompilation:

```bash
# Watch mode with TypeScript
npm run dev

# Or with bun
bun run dev
```

This will:
- Watch for file changes
- Automatically recompile TypeScript
- Restart the server on changes

### Testing with MCP Inspector

The MCP SDK provides an inspector tool for testing tools without a full client:

```bash
# Install MCP inspector globally
npm install -g @modelcontextprotocol/inspector

# Run inspector with your server
mcp-inspector node dist/index.js
```

The inspector provides a web interface (usually at http://localhost:5173) where you can:
- View registered tools
- Test tool invocations with custom inputs
- Inspect request/response payloads
- Debug tool schemas and validation

### Connecting to Claude Desktop

1. **Restart Claude Desktop** after updating the config file
2. **Open Claude Desktop** and start a new conversation
3. **Verify Connection**: Ask Claude "What tools do you have available?"
4. **Test a Tool**: Try a command like "Show me my tasks for today"

Claude should list Sunsama tools in its available capabilities and be able to execute them.

### Connecting to Cursor

1. **Restart Cursor** after updating the config
2. **Open Cursor's AI panel** (Cmd/Ctrl + K)
3. **Check MCP Status**: Look for "Sunsama" in connected MCP servers
4. **Test Integration**: Ask "What's on my Sunsama schedule today?"

---

## Development Workflow

### Directory Structure Overview

Understanding the codebase organization will help you navigate and extend features:

```
sunsama-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # MCP tool handlers
│   │   ├── task-tools.ts     # Task CRUD operations
│   │   ├── user-tools.ts     # User/metadata operations
│   │   └── stream-tools.ts   # Channel/stream organization
│   ├── auth/                 # Authentication strategies
│   ├── services/             # Business logic layer
│   │   ├── sunsama-client.ts # HTTP client with retry logic
│   │   ├── cache.ts          # 30s TTL cache implementation
│   │   └── auth.ts           # Keychain credential storage
│   ├── models/               # TypeScript types and Zod schemas
│   │   ├── task.ts           # Task entity definitions
│   │   ├── user.ts           # User entity definitions
│   │   └── api-responses.ts  # Sunsama API response schemas
│   └── utils/
│       ├── error-handler.ts  # Exponential backoff retry logic
│       └── date-utils.ts     # Timezone-aware date handling
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docs/
│   ├── api-discovery.md      # API discovery methodology
│   ├── endpoints/            # Per-endpoint documentation
│   └── COVERAGE_MATRIX.md    # Feature coverage tracking
├── specs/                    # Feature specifications
│   └── 001-complete-sunsama-api/
│       ├── spec.md           # Feature spec
│       ├── plan.md           # Implementation plan
│       ├── research.md       # API research findings
│       └── quickstart.md     # This file
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New MCP Tools

When extending the server with new Sunsama API endpoints, follow this pattern:

#### 1. Discover the API Endpoint

Use browser DevTools to capture Sunsama web app API calls:

```bash
# Steps:
# 1. Open Chrome/Firefox DevTools (F12)
# 2. Go to Network tab
# 3. Filter: Fetch/XHR
# 4. Enable "Preserve log"
# 5. Perform action in Sunsama web UI
# 6. Identify API request/response
# 7. Right-click request → Copy as cURL
```

**Example**: Discovering the "get tasks by day" endpoint:

1. Navigate to Sunsama web app
2. Open DevTools Network tab
3. Click on a specific day in Sunsama
4. Observe request: `GET https://api.sunsama.com/graphql?query=...`
5. Copy request as cURL
6. Test with httpie:
   ```bash
   http GET 'https://api.sunsama.com/graphql' \
     Authorization:"Bearer YOUR_TOKEN" \
     query=='query getTasks($date: String!) { tasks(date: $date) { id text completed } }' \
     variables:='{"date":"2025-10-12"}'
   ```

#### 2. Document the Endpoint

Create a markdown file in `docs/endpoints/`:

```bash
touch docs/endpoints/get-tasks-by-day.md
```

**Template** (`docs/endpoints/get-tasks-by-day.md`):

```markdown
# Get Tasks by Day

**Endpoint**: `GET /graphql` or `GET /api/v1/tasks`
**Authentication**: Bearer token in Authorization header

## Request

```bash
http GET 'https://api.sunsama.com/api/v1/tasks' \
  Authorization:"Bearer TOKEN" \
  date==2025-10-12
```

## Response (200 OK)

```json
{
  "tasks": [
    {
      "id": "task_abc123",
      "text": "Review Q4 budget",
      "completed": false,
      "date": "2025-10-12",
      "plannedTime": 60,
      "notes": "Check expenses"
    }
  ]
}
```

## Error Cases

- **401**: Invalid/expired authentication token
- **400**: Invalid date format (must be YYYY-MM-DD)
- **404**: No tasks found for date (returns empty array, not 404)

## Known Quirks

- Date parameter must be in ISO format (YYYY-MM-DD)
- Response includes completed and incomplete tasks by default
- Time zone is based on user's profile timezone setting
```

#### 3. Define Zod Schemas

Add type definitions and validation schemas in `src/models/`:

```typescript
// src/models/task.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Task text required'),
  completed: z.boolean(),
  date: z.string().nullable(),
  plannedTime: z.number().min(0).optional(),
  notes: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  streamId: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const GetTasksByDayInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  includeCompleted: z.boolean().optional().default(true),
});

export type GetTasksByDayInput = z.infer<typeof GetTasksByDayInputSchema>;
```

#### 4. Implement the API Client Method

Add the API call to `src/services/sunsama-client.ts`:

```typescript
// src/services/sunsama-client.ts
import { Task, GetTasksByDayInput } from '../models/task.js';

export class SunsamaClient {
  private baseURL = 'https://api.sunsama.com';
  private authToken: string;

  async getTasksByDay(input: GetTasksByDayInput): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/api/v1/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        date: input.date,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    const data = await response.json();

    // Validate response with Zod
    const tasks = z.array(TaskSchema).parse(data.tasks);

    return tasks;
  }
}
```

#### 5. Register the MCP Tool

Add the tool handler in `src/tools/task-tools.ts`:

```typescript
// src/tools/task-tools.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { GetTasksByDayInputSchema } from '../models/task.js';
import { sunsamaClient } from '../services/sunsama-client.js';

export function registerTaskTools(server: Server) {
  server.registerTool(
    'get-tasks-by-day',
    {
      title: 'Get Tasks by Day',
      description: 'Retrieve all tasks scheduled for a specific date',
      inputSchema: GetTasksByDayInputSchema,
    },
    async (input) => {
      const validated = GetTasksByDayInputSchema.parse(input);
      const tasks = await sunsamaClient.getTasksByDay(validated);

      return {
        content: [
          {
            type: 'text',
            text: `Found ${tasks.length} tasks for ${validated.date}`,
          },
        ],
        structuredContent: {
          tasks,
        },
      };
    }
  );
}
```

#### 6. Write Tests

Add unit and integration tests:

```typescript
// tests/integration/task-tools.test.ts
import { describe, test, expect } from 'bun:test';
import { sunsamaClient } from '../../src/services/sunsama-client.js';

describe('Task Tools', () => {
  test('get-tasks-by-day returns tasks for today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await sunsamaClient.getTasksByDay({ date: today });

    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.every(t => t.date === today)).toBe(true);
  });

  test('get-tasks-by-day validates date format', async () => {
    await expect(
      sunsamaClient.getTasksByDay({ date: 'invalid-date' })
    ).rejects.toThrow('Date must be YYYY-MM-DD format');
  });
});
```

Run tests:

```bash
# Run all tests
bun test

# Run integration tests (requires Sunsama credentials)
bun test:integration

# Run with watch mode
bun test:watch
```

### API Endpoint Discovery Process

For discovering new Sunsama API endpoints systematically, follow the methodology documented in `specs/001-complete-sunsama-api/research.md`:

**Quick Reference**:

1. **Setup**: Open Sunsama web app with DevTools (F12) open
2. **Filter**: Network tab → Filter to "Fetch/XHR"
3. **Enable**: "Preserve log" and "Disable cache"
4. **Action**: Perform single action in Sunsama UI
5. **Capture**: Right-click request → Copy as cURL
6. **Test**: Validate with httpie:
   ```bash
   http GET https://api.sunsama.com/endpoint \
     Authorization:"Bearer TOKEN" \
     param==value
   ```
7. **Document**: Create endpoint documentation in `docs/endpoints/`
8. **Implement**: Add Zod schemas, API client method, MCP tool

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/task-tools.test.ts

# Run with coverage
npm run test:coverage

# Run integration tests only (requires Sunsama account)
npm run test:integration

# Watch mode for development
npm run test:watch
```

**Note**: Integration tests require valid Sunsama credentials and will make real API calls to a dedicated test workspace.

---

## Troubleshooting

### Common Issues

#### 1. Keychain Access Denied

**Symptom**: Error message "Keychain access denied" or "Unable to store credentials"

**Solutions**:

- **macOS**: Grant Terminal/Node.js access in System Preferences → Security & Privacy → Privacy → Keychain
- **Linux**: Ensure GNOME Keyring or KDE Wallet daemon is running:
  ```bash
  # Check if keyring is running
  ps aux | grep gnome-keyring

  # Start keyring manually (GNOME)
  gnome-keyring-daemon --start
  ```
- **Fallback**: Use environment variables (less secure):
  ```bash
  export SUNSAMA_EMAIL="your-email@example.com"
  export SUNSAMA_PASSWORD="your-password"
  ```

#### 2. Authentication Fails

**Symptom**: "401 Unauthorized" or "Invalid credentials"

**Solutions**:

1. **Verify credentials** in Sunsama web app
2. **Check email format** (must match Sunsama account email exactly)
3. **Test login manually**:
   ```bash
   curl -X POST https://api.sunsama.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}'
   ```
4. **Clear stored credentials** and re-run setup:
   ```bash
   # macOS: Delete keychain entries
   security delete-generic-password -s sunsama-mcp -a email
   security delete-generic-password -s sunsama-mcp -a password

   # Re-run setup
   npm run setup
   ```

#### 3. API Endpoint Returns 404

**Symptom**: API calls return "404 Not Found" for previously working endpoints

**Possible Causes**:

- Sunsama API has changed (endpoints moved or renamed)
- Incorrect API base URL
- API versioning change

**Solutions**:

1. **Re-discover endpoint** using DevTools:
   - Open Sunsama web app with DevTools
   - Perform the same action
   - Check if endpoint URL has changed
2. **Check API version** in response headers:
   ```bash
   curl -I https://api.sunsama.com/api/v1/tasks
   ```
3. **Update endpoint documentation** in `docs/endpoints/`
4. **Log API version** for tracking:
   ```typescript
   console.log('API Version:', response.headers.get('x-api-version'));
   ```

#### 4. MCP Client Can't Connect

**Symptom**: Claude Desktop or Cursor shows "MCP server not available"

**Solutions**:

1. **Check config file path**:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`
2. **Verify absolute paths** in config (no `~` or relative paths):
   ```json
   {
     "args": ["/Users/username/sunsama-mcp/dist/index.js"]
   }
   ```
3. **Check server builds successfully**:
   ```bash
   npm run build
   ls -la dist/index.js  # Should exist
   ```
4. **Test server manually**:
   ```bash
   node dist/index.js
   # Should not exit immediately; waits for stdio input
   ```
5. **Restart MCP client** (Claude Desktop/Cursor) after config changes

#### 5. Cache Returns Stale Data

**Symptom**: Tasks updated in Sunsama web app don't appear in MCP server responses

**Explanation**: The server caches task data for 30 seconds to reduce API calls.

**Solutions**:

1. **Wait 30 seconds** for cache to expire
2. **Perform a write operation** (create, update, delete) to bypass cache:
   ```
   # This bypasses cache and fetches fresh data
   "Create a task for today"
   ```
3. **Disable cache temporarily** (for development):
   ```typescript
   // src/services/cache.ts
   const TTL = 0; // Disable cache
   ```

### Debug Logging

Enable detailed logging for troubleshooting:

```bash
# Enable MCP SDK debug logs
DEBUG=mcp:* node dist/index.js

# Enable all debug logs
DEBUG=* node dist/index.js

# Enable Sunsama client logs only
DEBUG=sunsama:* node dist/index.js
```

### Manual API Testing with httpie

Test Sunsama API endpoints directly without the MCP server:

```bash
# 1. Authenticate and get token
TOKEN=$(curl -s -X POST https://api.sunsama.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}' \
  | jq -r '.token')

# 2. Test endpoint
http GET https://api.sunsama.com/api/v1/tasks \
  Authorization:"Bearer $TOKEN" \
  date==2025-10-12

# 3. Create a task
http POST https://api.sunsama.com/api/v1/tasks \
  Authorization:"Bearer $TOKEN" \
  text="Test task" \
  date="2025-10-12"
```

### Getting Help

If you encounter issues not covered here:

1. **Check repository issues**: https://github.com/robertn702/mcp-sunsama/issues
2. **Review research documentation**: `specs/001-complete-sunsama-api/research.md`
3. **Inspect API logs**: Enable debug logging and check for error patterns
4. **Test with MCP inspector**: Use `mcp-inspector` to isolate tool-specific issues
5. **Verify Sunsama web app**: Ensure operations work in Sunsama's official interface

---

## Next Steps

After completing this quickstart:

1. **Review Feature Spec**: Read `specs/001-complete-sunsama-api/spec.md` for complete feature requirements
2. **Check Implementation Plan**: Review `specs/001-complete-sunsama-api/plan.md` for architecture details
3. **Explore API Research**: Study `specs/001-complete-sunsama-api/research.md` for API patterns and best practices
4. **Track Coverage**: Maintain `docs/COVERAGE_MATRIX.md` as you add new endpoints
5. **Write Tests**: Add integration tests for each new tool in `tests/integration/`

## Additional Resources

- **MCP Protocol Specification**: https://modelcontextprotocol.io
- **MCP TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Sunsama Help Docs**: https://help.sunsama.com/docs/
- **Base Implementation**: https://github.com/robertn702/mcp-sunsama
- **Zod Documentation**: https://zod.dev/

---

**Last Updated**: 2025-10-12
**Status**: Active
**Maintainer**: Project Team
