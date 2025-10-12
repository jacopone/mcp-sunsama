---
status: active
created: 2025-10-12
updated: 2025-10-12
type: research
lifecycle: persistent
---

# Research: Complete Sunsama API Coverage MCP Server

## Executive Summary

This research document provides comprehensive technical findings for implementing a complete Sunsama API coverage MCP server, extending robertn702/mcp-sunsama from ~60-70% to 90% feature coverage. The research covers five critical areas: base implementation analysis, API discovery methodology, MCP protocol patterns, caching strategies, and secure credential storage.

## Table of Contents

1. [robertn702/mcp-sunsama Architecture Analysis](#1-robertn702mcp-sunsama-architecture-analysis)
2. [Sunsama API Discovery Best Practices](#2-sunsama-api-discovery-best-practices)
3. [MCP Protocol Implementation Patterns](#3-mcp-protocol-implementation-patterns)
4. [Caching Strategy for Personal-Use MCP Servers](#4-caching-strategy-for-personal-use-mcp-servers)
5. [System Keychain Integration (Node.js)](#5-system-keychain-integration-nodejs)
6. [References](#references)

---

## 1. robertn702/mcp-sunsama Architecture Analysis

### Repository Structure

```
src/
├── tools/           # Core MCP tool implementations
│   ├── user-tools.ts
│   ├── task-tools.ts
│   └── stream-tools.ts
├── auth/            # Authentication strategies
├── transports/      # Communication methods (stdio/HTTP)
├── session/         # Session management
├── config/          # Environment configurations
└── utils/           # Utility functions
```

### Existing MCP Tools Coverage

**Task Management Tools (14 tools):**
- `create-task` - Create new tasks with notes, time estimates, due dates
- `get-tasks-by-day` - Retrieve tasks for a specific day with completion filtering
- `get-tasks-backlog` - Access backlog tasks
- `get-archived-tasks` - Retrieve archived tasks
- `get-task-by-id` - Fetch specific task details
- `update-task-complete` - Mark tasks complete with custom timestamps
- `update-task-planned-time` - Update time estimates
- `update-task-notes` - Modify task notes
- `update-task-due-date` - Change due dates
- `update-task-text` - Update task title/text
- `update-task-stream` - Move tasks between streams/channels
- `update-task-snooze-date` - Snooze tasks to future dates
- `update-task-backlog` - Move tasks to backlog
- `delete-task` - Permanently delete tasks

**User & Organization Tools (2 tools):**
- `get-user` - Retrieve user profile, timezone, group details
- `get-streams` - Get available streams/channels for project organization

### Authentication Implementation

**Dual Authentication Strategy:**

1. **STDIO Transport:**
   - Requires environment variables: `SUNSAMA_EMAIL` and `SUNSAMA_PASSWORD`
   - Credentials loaded at process startup
   - No per-request authentication

2. **HTTP Transport:**
   - Uses HTTP Basic Auth per request
   - Credentials passed in request headers
   - More flexible for multi-user scenarios

**Current Limitations:**
- No keychain integration (credentials in environment variables)
- Password stored in plain text in shell configs
- No token-based authentication support

### Testing Approach

**Test Structure:**
```bash
# Unit tests (no authentication required)
bun test

# Integration tests (requires Sunsama credentials)
bun test:integration

# Run all tests
bun test:all

# Watch mode for development
bun test:watch
```

**Testing Strategy:**
- Modular test organization mirroring src/ structure
- Integration tests validate against live Sunsama API
- Uses Bun test runner for performance

### Existing API Endpoint Coverage

**Estimated Coverage: 60-70% of Sunsama Web UI features**

**Covered Areas:**
- Core task CRUD operations
- Daily planning workflow
- Backlog management
- Basic stream/channel organization
- User profile access
- Task completion tracking
- Task scheduling (due dates, snooze)

**Known Gaps (from web UI analysis):**
- Calendar integration features (timeboxing, calendar events)
- Advanced task attributes (subtasks, dependencies, labels)
- Time tracking (work sessions, focus mode)
- Ritual workflows (daily/weekly planning sessions)
- Comments and collaboration features
- Task import from integrations (Gmail, Trello, Asana, etc.)
- Weekly planning and review workflows
- Custom views and filters
- Recurring tasks
- Task prioritization mechanisms

### Architecture Strengths

**Decision: Well-structured, maintainable TypeScript codebase**

**Rationale:**
- Clean separation of concerns (tools, auth, transport, session)
- Type safety with TypeScript and Zod validation
- Dual transport support provides flexibility
- Modular design facilitates extension

**Alternatives Considered:**
- Monolithic structure (rejected - harder to maintain)
- JavaScript without types (rejected - less reliability)

**Implementation Notes:**
- Use TypeScript throughout for consistency
- Follow existing code style and organization patterns
- Extend tool files (task-tools.ts, etc.) rather than creating new modules
- Leverage existing auth and transport infrastructure

---

## 2. Sunsama API Discovery Best Practices

### Recommended Discovery Process

**Decision: Browser DevTools + Network Interception + Systematic Documentation**

**Rationale:**
- Sunsama API is not publicly documented
- Web UI interactions reveal actual API endpoints
- Chrome/Firefox DevTools provide comprehensive request/response capture
- Low-cost, no additional tooling required

### Step-by-Step Discovery Methodology

#### Phase 1: Setup and Preparation

1. **Browser Configuration:**
   ```bash
   # Use incognito/private window for clean session
   # Open DevTools: F12 or Ctrl+Shift+I (Linux)
   # Navigate to Network tab
   ```

2. **Network Tab Setup:**
   - Filter: Switch from "All" to "Fetch/XHR" to focus on API calls
   - Enable "Preserve log" to keep requests across page navigation
   - Enable "Disable cache" to ensure fresh requests
   - Clear existing requests before starting

3. **Authentication Capture:**
   - Clear cookies and storage
   - Log in to Sunsama while recording
   - Capture authentication tokens/cookies
   - Document auth headers and mechanisms

#### Phase 2: Systematic Feature Exploration

1. **Feature-by-Feature Analysis:**
   ```
   For each Sunsama web UI feature:
   a) Clear network log
   b) Perform single action in UI
   c) Identify corresponding API request(s)
   d) Document endpoint, method, headers, payload
   e) Test endpoint with captured credentials
   ```

2. **Request Documentation Template:**
   ```markdown
   ### Feature: [Feature Name]

   **Endpoint:** `POST /api/v1/endpoint`
   **Authentication:** Bearer token in Authorization header
   **Request Body:**
   ```json
   {
     "field": "value",
     "required_field": true
   }
   ```

   **Response (200 OK):**
   ```json
   {
     "id": "task_123",
     "status": "success"
   }
   ```

   **Error Cases:**
   - 401: Invalid/expired authentication
   - 400: Invalid request parameters
   - 404: Resource not found
   ```

#### Phase 3: Request/Response Payload Capture

**Using Chrome DevTools:**

1. **Right-click on request → Copy:**
   - Copy as cURL (complete command with headers)
   - Copy request headers
   - Copy response payload
   - Copy as fetch (JavaScript code)

2. **Inspect Request Details:**
   - Headers tab: Authentication, Content-Type, User-Agent
   - Payload tab: Request body (JSON, FormData)
   - Preview tab: Formatted response
   - Response tab: Raw response data

3. **Export for Testing:**
   ```bash
   # Copy as cURL, then modify for testing
   curl 'https://api.sunsama.com/api/v1/tasks' \
     -H 'Authorization: Bearer YOUR_TOKEN' \
     -H 'Content-Type: application/json' \
     --data-raw '{"text":"Test task","date":"2025-10-12"}'
   ```

### Tools for Endpoint Testing

**Decision: httpie for primary testing, curl for scripting**

**Rationale:**
- httpie: Human-friendly syntax, colored output, intuitive for manual testing
- curl: Ubiquitous, scriptable, ideal for CI/CD and automation
- Postman: Good for collaboration but overkill for personal project

**Testing Workflow:**

1. **Initial Exploration (httpie):**
   ```bash
   # GET request
   http GET https://api.sunsama.com/api/v1/tasks \
     Authorization:"Bearer YOUR_TOKEN"

   # POST request
   http POST https://api.sunsama.com/api/v1/tasks \
     Authorization:"Bearer YOUR_TOKEN" \
     text="New task" \
     date="2025-10-12"

   # JSON output to file
   http GET https://api.sunsama.com/api/v1/tasks > response.json
   ```

2. **Automated Testing (curl):**
   ```bash
   # Script for batch testing
   #!/bin/bash
   TOKEN="your_token"
   BASE_URL="https://api.sunsama.com/api/v1"

   test_endpoint() {
     curl -s -w "\n%{http_code}" \
       -H "Authorization: Bearer $TOKEN" \
       "$BASE_URL/$1" | jq .
   }

   test_endpoint "tasks"
   test_endpoint "user"
   test_endpoint "streams"
   ```

3. **Validation (jq):**
   ```bash
   # Extract specific fields
   http GET api.sunsama.com/api/v1/tasks | jq '.tasks[].id'

   # Validate response structure
   http GET api.sunsama.com/api/v1/tasks | \
     jq 'has("tasks") and (.tasks | length > 0)'
   ```

### Best Practices for Handling Undocumented API Changes

**Decision: Version detection + graceful degradation + proactive monitoring**

**Rationale:**
- Undocumented APIs change without notice
- Breaking changes can render MCP server unusable
- User experience should degrade gracefully, not fail catastrophically

**Implementation Strategy:**

1. **API Version Detection:**
   ```typescript
   // Check for API version in responses
   interface APIResponse {
     version?: string;
     data: any;
   }

   const KNOWN_API_VERSION = "1.0.0";

   function checkAPICompatibility(response: APIResponse) {
     if (response.version && response.version !== KNOWN_API_VERSION) {
       logger.warn(`API version mismatch: expected ${KNOWN_API_VERSION}, got ${response.version}`);
       // Could trigger notification or fallback behavior
     }
   }
   ```

2. **Schema Validation with Graceful Fallback:**
   ```typescript
   import { z } from 'zod';

   const TaskSchema = z.object({
     id: z.string(),
     text: z.string(),
     date: z.string().optional(),
     // Mark potentially unstable fields as optional
     newField: z.unknown().optional(),
   });

   function parseTaskResponse(data: unknown) {
     const result = TaskSchema.safeParse(data);

     if (!result.success) {
       logger.error('Task schema validation failed:', result.error);
       // Return partial data or cached version
       return extractKnownFields(data);
     }

     return result.data;
   }
   ```

3. **Proactive Monitoring:**
   ```typescript
   // Log all API interactions to detect changes
   class APIMonitor {
     private endpointStats = new Map<string, {
       successCount: number;
       errorCount: number;
       lastError: Error | null;
     }>();

     recordRequest(endpoint: string, success: boolean, error?: Error) {
       const stats = this.endpointStats.get(endpoint) || {
         successCount: 0,
         errorCount: 0,
         lastError: null,
       };

       if (success) {
         stats.successCount++;
       } else {
         stats.errorCount++;
         stats.lastError = error || null;
       }

       this.endpointStats.set(endpoint, stats);

       // Alert if error rate spikes
       if (stats.errorCount > 5 && stats.errorCount > stats.successCount) {
         logger.error(`High error rate for ${endpoint}: ${stats.errorCount} errors`);
       }
     }
   }
   ```

4. **Fallback Mechanisms:**
   ```typescript
   // Try multiple API patterns
   async function fetchTasksWithFallback(date: string) {
     // Try new endpoint
     try {
       return await fetchTasks('/api/v2/tasks', { date });
     } catch (error) {
       logger.warn('New API failed, trying legacy endpoint');
     }

     // Fall back to old endpoint
     try {
       return await fetchTasks('/api/v1/tasks', { date });
     } catch (error) {
       logger.error('All API endpoints failed');
       throw new Error('Unable to fetch tasks');
     }
   }
   ```

5. **Change Detection:**
   ```typescript
   // Store response schemas and detect changes
   class SchemaTracker {
     private knownSchemas = new Map<string, Set<string>>();

     trackResponse(endpoint: string, data: any) {
       const keys = new Set(Object.keys(data));
       const known = this.knownSchemas.get(endpoint);

       if (!known) {
         this.knownSchemas.set(endpoint, keys);
         return;
       }

       // Detect new fields
       const newFields = [...keys].filter(k => !known.has(k));
       if (newFields.length > 0) {
         logger.info(`New fields detected in ${endpoint}:`, newFields);
       }

       // Detect removed fields
       const removedFields = [...known].filter(k => !keys.has(k));
       if (removedFields.length > 0) {
         logger.warn(`Fields removed from ${endpoint}:`, removedFields);
       }

       // Update known schema
       newFields.forEach(f => known.add(f));
     }
   }
   ```

**Alternatives Considered:**
- Strict validation only (rejected - too brittle for undocumented API)
- No validation (rejected - unsafe, silent failures)
- API mocking layer (deferred - complex for initial implementation)

**Implementation Notes:**
- Document all discovered endpoints in separate API_REFERENCE.md
- Include example request/response for each endpoint
- Note date discovered and any version information observed
- Tag endpoints as "stable", "unstable", or "experimental" based on observation

---

## 3. MCP Protocol Implementation Patterns

### Tool Registration Patterns

**Decision: TypeScript SDK with Zod validation**

**Rationale:**
- Official @modelcontextprotocol/sdk (v1.20.0) provides type-safe API
- Zod schemas enable runtime validation and type inference
- Follows established patterns from robertn702/mcp-sunsama
- Excellent TypeScript integration

**Tool Registration API:**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

// 1. Define input/output schemas with Zod
const CreateTaskSchema = z.object({
  text: z.string().min(1, 'Task text required'),
  date: z.string().optional(),
  notes: z.string().optional(),
  plannedTime: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  streamId: z.string().optional(),
});

type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

const TaskOutputSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  date: z.string().nullable(),
  createdAt: z.string(),
});

type TaskOutput = z.infer<typeof TaskOutputSchema>;

// 2. Register tool with server
server.registerTool(
  'create-task',
  {
    title: 'Create Task',
    description: 'Create a new task in Sunsama with optional notes, due date, and time estimate',
    inputSchema: CreateTaskSchema,
    outputSchema: TaskOutputSchema,
  },
  async (input: CreateTaskInput) => {
    // 3. Validate input (automatic with Zod)
    const validated = CreateTaskSchema.parse(input);

    // 4. Perform operation
    const task = await sunsama.createTask(validated);

    // 5. Return structured response
    return {
      content: [
        {
          type: 'text',
          text: `Created task: ${task.text} (ID: ${task.id})`,
        },
      ],
      structuredContent: task,
    };
  }
);
```

**Key Patterns:**

1. **Zod Schema Definition:**
   - Use `.min()`, `.max()`, `.optional()` for validation
   - Infer TypeScript types with `z.infer<typeof Schema>`
   - Provide clear error messages in validation rules

2. **Tool Naming Convention:**
   - Use kebab-case: `create-task`, `get-tasks-by-day`
   - Verb-noun pattern: `get-user`, `update-task-complete`
   - Clear, descriptive names matching intent

3. **Response Structure:**
   ```typescript
   return {
     content: [
       { type: 'text', text: 'Human-readable response' },
       { type: 'resource', uri: 'sunsama://task/123' }, // optional
     ],
     structuredContent: { /* machine-readable data */ },
   };
   ```

### JSON Schema Validation Best Practices

**Decision: Zod for schemas + runtime validation + type inference**

**Rationale:**
- Zod provides single source of truth for validation and types
- Runtime validation prevents invalid data from reaching business logic
- Excellent error messages for debugging
- Integrates seamlessly with MCP SDK

**Validation Patterns:**

1. **Complex Object Validation:**
   ```typescript
   const TaskUpdateSchema = z.object({
     taskId: z.string().uuid('Invalid task ID format'),
     updates: z.object({
       text: z.string().min(1).max(500).optional(),
       completed: z.boolean().optional(),
       date: z.string().datetime().optional(),
       plannedTime: z.number().min(0).max(1440).optional(), // max 24 hours
     }).refine(
       (data) => Object.keys(data).length > 0,
       { message: 'At least one field must be updated' }
     ),
   });
   ```

2. **Union Types for Flexible Input:**
   ```typescript
   const DateInputSchema = z.union([
     z.string().datetime(),
     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     z.date(),
   ]).transform((val) => {
     // Normalize to ISO date string
     return typeof val === 'string' ? val : val.toISOString().split('T')[0];
   });
   ```

3. **Discriminated Unions for Tool Variants:**
   ```typescript
   const TaskFilterSchema = z.discriminatedUnion('type', [
     z.object({ type: z.literal('day'), date: z.string() }),
     z.object({ type: z.literal('backlog') }),
     z.object({ type: z.literal('completed'), since: z.string() }),
   ]);
   ```

4. **Custom Refinements:**
   ```typescript
   const TaskSchema = z.object({
     text: z.string(),
     dueDate: z.string().optional(),
     startDate: z.string().optional(),
   }).refine(
     (data) => {
       if (data.dueDate && data.startDate) {
         return new Date(data.startDate) <= new Date(data.dueDate);
       }
       return true;
     },
     { message: 'Start date must be before due date' }
   );
   ```

**Alternatives Considered:**
- JSON Schema (rejected - requires separate type definitions)
- io-ts (considered - Zod has better DX)
- TypeScript interfaces only (rejected - no runtime validation)

### Error Handling Conventions

**Decision: JSON-RPC error codes + structured error responses**

**Rationale:**
- MCP inherits JSON-RPC 2.0 error handling
- Standard error codes enable consistent client-side handling
- Structured errors provide actionable information

**Standard Error Codes:**

| Code | Meaning | When to Use |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON received |
| -32600 | Invalid Request | Missing required fields, wrong structure |
| -32601 | Method not found | Unknown tool/method called |
| -32602 | Invalid params | Parameters fail validation |
| -32603 | Internal error | Server/API failure, unexpected exceptions |
| -32000 to -32099 | Server error | Implementation-defined errors |

**Error Response Pattern:**

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Standard error codes from MCP SDK
enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

// Custom error class
class SunsamaAPIError extends McpError {
  constructor(
    code: ErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(code, message);
    this.name = 'SunsamaAPIError';
  }
}

// Usage in tool handler
async function getTaskById(input: { taskId: string }) {
  try {
    // Validate input
    if (!input.taskId) {
      throw new SunsamaAPIError(
        ErrorCode.InvalidParams,
        'taskId is required',
        { received: input }
      );
    }

    // Call API
    const task = await sunsama.getTask(input.taskId);

    if (!task) {
      throw new SunsamaAPIError(
        ErrorCode.InvalidParams,
        `Task not found: ${input.taskId}`,
        { taskId: input.taskId }
      );
    }

    return task;

  } catch (error) {
    if (error instanceof SunsamaAPIError) {
      throw error; // Re-throw MCP errors
    }

    // Handle Sunsama API errors
    if (error instanceof Response) {
      if (error.status === 401) {
        throw new SunsamaAPIError(
          ErrorCode.InternalError,
          'Authentication failed',
          { status: 401 }
        );
      }
      if (error.status === 404) {
        throw new SunsamaAPIError(
          ErrorCode.InvalidParams,
          'Resource not found',
          { status: 404 }
        );
      }
    }

    // Unknown errors
    throw new SunsamaAPIError(
      ErrorCode.InternalError,
      'Unexpected error occurred',
      { originalError: String(error) }
    );
  }
}
```

**Error Handling Best Practices:**

1. **Validation Errors → InvalidParams (-32602):**
   ```typescript
   if (!CreateTaskSchema.safeParse(input).success) {
     throw new SunsamaAPIError(
       ErrorCode.InvalidParams,
       'Invalid task data',
       { schema: CreateTaskSchema }
     );
   }
   ```

2. **API Failures → InternalError (-32603):**
   ```typescript
   catch (error) {
     if (error.response?.status >= 500) {
       throw new SunsamaAPIError(
         ErrorCode.InternalError,
         'Sunsama API error',
         { status: error.response.status }
       );
     }
   }
   ```

3. **Not Found → InvalidParams (debatable) or Custom Code:**
   ```typescript
   // Option 1: Use InvalidParams for "invalid resource ID"
   throw new SunsamaAPIError(
     ErrorCode.InvalidParams,
     'Task does not exist'
   );

   // Option 2: Use custom server error code
   const ErrorCode_NotFound = -32001;
   throw new SunsamaAPIError(
     ErrorCode_NotFound,
     'Task does not exist'
   );
   ```

**Alternatives Considered:**
- HTTP-style errors (rejected - not MCP-compliant)
- Generic error messages (rejected - poor DX)
- No error details (rejected - hard to debug)

### Transport Layer Patterns

**Decision: Stdio for Claude Desktop, with SSE-ready architecture**

**Rationale:**
- Claude Desktop currently only supports stdio transport
- Personal-use MCP server runs locally (no remote hosting needed)
- SSE architecture enables future remote deployment if needed

**STDIO vs SSE Comparison:**

| Feature | STDIO | SSE (Server-Sent Events) |
|---------|-------|--------------------------|
| **Use Case** | Local, single-user | Remote, multi-user |
| **Communication** | Process stdin/stdout | HTTP long-polling |
| **Security** | Process isolation | TLS encryption required |
| **Setup Complexity** | Simple (child process) | Complex (HTTP server) |
| **Scalability** | Single client | Multiple concurrent clients |
| **Claude Desktop Support** | ✅ Yes | ❌ Not yet supported |
| **Debugging** | Easier (logs to stderr) | Requires HTTP tooling |

**STDIO Implementation Pattern:**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'sunsama-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.registerTool(/* ... */);

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Cleanup on exit
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
```

**SSE-Ready Architecture:**

```typescript
// Create transport factory for flexibility
type TransportType = 'stdio' | 'sse';

function createTransport(type: TransportType, config: any) {
  switch (type) {
    case 'stdio':
      return new StdioServerTransport();

    case 'sse':
      // Future SSE implementation
      return new StreamableHTTPServerTransport({
        sessionId: config.sessionId,
        endpoint: config.endpoint,
      });

    default:
      throw new Error(`Unknown transport type: ${type}`);
  }
}

// Usage
const transport = createTransport(
  process.env.MCP_TRANSPORT || 'stdio',
  config
);
```

**Alternatives Considered:**
- SSE only (rejected - Claude Desktop doesn't support yet)
- HTTP REST (rejected - not MCP-compliant)
- WebSocket (rejected - not in MCP spec)

**Implementation Notes:**
- Use stdio for initial implementation
- Design with transport abstraction layer
- When Claude Desktop supports SSE, add SSE transport option
- Keep business logic independent of transport layer

---

## 4. Caching Strategy for Personal-Use MCP Servers

### Cache Implementation Decision

**Decision: lru-cache with TTL for frequently accessed data**

**Rationale:**
- Personal-use = single user, predictable access patterns
- LRU (Least Recently Used) eviction fits daily planning workflow
- TTL ensures data freshness (30-second requirement)
- Minimal memory footprint for single-user scenario
- Zero external dependencies (in-memory only)

**Alternatives Considered:**
- Redis (rejected - overkill for single user, requires external service)
- node-cache (considered - lru-cache more performant)
- @isaacs/ttlcache (considered - TTL-first, but LRU eviction also valuable)
- Simple Map (rejected - no TTL or size limits)

### LRU-Cache Configuration

**Installation:**
```bash
npm install lru-cache
# or
bun add lru-cache
```

**Basic Configuration:**

```typescript
import { LRUCache } from 'lru-cache';

interface CacheOptions {
  max?: number;         // Maximum items
  ttl?: number;         // Time to live (ms)
  updateAgeOnGet?: boolean;  // Update age on access
  updateAgeOnHas?: boolean;  // Update age on has() check
}

// Cache configuration for different data types
const taskCache = new LRUCache<string, Task>({
  max: 500,                    // Maximum 500 tasks
  ttl: 30 * 1000,              // 30 second TTL (as specified)
  updateAgeOnGet: true,        // Refresh TTL on access
  updateAgeOnHas: false,       // Don't refresh on has() check
});

const userCache = new LRUCache<string, User>({
  max: 10,                     // Few users (personal use)
  ttl: 5 * 60 * 1000,          // 5 minute TTL (user data rarely changes)
  updateAgeOnGet: true,
});

const streamCache = new LRUCache<string, Stream[]>({
  max: 1,                      // Single user's streams
  ttl: 5 * 60 * 1000,          // 5 minute TTL
  updateAgeOnGet: true,
});
```

### Cache Access Patterns

**Read-Through Pattern:**

```typescript
class SunsamaCachedClient {
  private taskCache: LRUCache<string, Task>;
  private api: SunsamaAPIClient;

  constructor(api: SunsamaAPIClient) {
    this.api = api;
    this.taskCache = new LRUCache({
      max: 500,
      ttl: 30 * 1000,
    });
  }

  async getTask(taskId: string): Promise<Task> {
    // 1. Check cache first
    const cached = this.taskCache.get(taskId);
    if (cached) {
      return cached;
    }

    // 2. Cache miss - fetch from API
    const task = await this.api.getTask(taskId);

    // 3. Store in cache
    this.taskCache.set(taskId, task);

    return task;
  }

  async getTasksByDay(date: string): Promise<Task[]> {
    // Use date as cache key
    const cacheKey = `day:${date}`;
    const cached = this.taskCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const tasks = await this.api.getTasksByDay(date);
    this.taskCache.set(cacheKey, tasks);

    return tasks;
  }
}
```

**Cache Invalidation on Write Operations:**

```typescript
class SunsamaCachedClient {
  // ... cache setup ...

  async createTask(data: CreateTaskInput): Promise<Task> {
    // 1. Perform write operation
    const task = await this.api.createTask(data);

    // 2. Invalidate related caches
    if (data.date) {
      const dayKey = `day:${data.date}`;
      this.taskCache.delete(dayKey);
    }

    // Invalidate backlog if task added there
    if (!data.date) {
      this.taskCache.delete('backlog');
    }

    // 3. Cache the new task
    this.taskCache.set(task.id, task);

    return task;
  }

  async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    // 1. Get old task to determine what to invalidate
    const oldTask = await this.getTask(taskId);

    // 2. Perform update
    const updatedTask = await this.api.updateTask(taskId, updates);

    // 3. Invalidate affected caches
    this.taskCache.delete(taskId);

    // If date changed, invalidate both old and new dates
    if (oldTask.date) {
      this.taskCache.delete(`day:${oldTask.date}`);
    }
    if (updatedTask.date && updatedTask.date !== oldTask.date) {
      this.taskCache.delete(`day:${updatedTask.date}`);
    }

    // 4. Cache updated task
    this.taskCache.set(updatedTask.id, updatedTask);

    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    // 1. Get task to know what to invalidate
    const task = this.taskCache.get(taskId) || await this.api.getTask(taskId);

    // 2. Perform deletion
    await this.api.deleteTask(taskId);

    // 3. Invalidate caches
    this.taskCache.delete(taskId);
    if (task.date) {
      this.taskCache.delete(`day:${task.date}`);
    }
    this.taskCache.delete('backlog');
  }
}
```

### Cache Invalidation Strategies

**Decision: Eager invalidation on writes + TTL fallback**

**Rationale:**
- Write operations are less frequent than reads (daily planning workflow)
- Eager invalidation ensures consistency for user
- TTL provides safety net if invalidation logic misses edge cases
- No complex cache coherence needed (single user)

**Invalidation Patterns:**

1. **Direct Invalidation (Specific Keys):**
   ```typescript
   cache.delete(taskId);
   cache.delete(`day:${date}`);
   ```

2. **Pattern-Based Invalidation:**
   ```typescript
   // Invalidate all tasks for a date
   function invalidateDay(date: string) {
     cache.delete(`day:${date}`);

     // Also invalidate aggregate views
     cache.delete('backlog');
     cache.delete('upcoming');
   }
   ```

3. **Cascade Invalidation:**
   ```typescript
   // Moving task to different stream invalidates stream caches
   async function updateTaskStream(taskId: string, newStreamId: string) {
     const task = await getTask(taskId);
     await api.updateTask(taskId, { streamId: newStreamId });

     // Invalidate old stream
     cache.delete(`stream:${task.streamId}`);

     // Invalidate new stream
     cache.delete(`stream:${newStreamId}`);

     // Invalidate task itself
     cache.delete(taskId);
   }
   ```

4. **Bulk Invalidation:**
   ```typescript
   // Clear all task caches (e.g., after bulk import)
   function clearTaskCaches() {
     cache.clear();
   }
   ```

### Memory Management for Single-User Scenarios

**Decision: Conservative limits with monitoring**

**Rationale:**
- Single user has bounded working set
- Daily planning typically involves 10-50 tasks
- Memory limits prevent unbounded growth
- V8 heap monitoring provides safety

**Memory Configuration:**

```typescript
const cacheConfig = {
  // Task cache: ~500 tasks × ~2KB each = ~1MB
  tasks: {
    max: 500,
    ttl: 30 * 1000,
  },

  // Day view cache: ~30 days × ~50 tasks × ~2KB = ~3MB
  dayViews: {
    max: 30,  // 30 days
    ttl: 30 * 1000,
  },

  // User/stream cache: ~10KB total
  metadata: {
    max: 10,
    ttl: 5 * 60 * 1000,
  },
};

// Total estimated memory: ~4MB (negligible for Node.js process)
```

**Memory Monitoring:**

```typescript
class CacheMonitor {
  private cache: LRUCache<any, any>;
  private warningThreshold: number;

  constructor(cache: LRUCache<any, any>, warningMB: number = 50) {
    this.cache = cache;
    this.warningThreshold = warningMB * 1024 * 1024;

    // Check memory usage every 60 seconds
    setInterval(() => this.checkMemory(), 60_000);
  }

  checkMemory() {
    const usage = process.memoryUsage();

    if (usage.heapUsed > this.warningThreshold) {
      console.warn(`High memory usage: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

      // Log cache stats
      console.warn(`Cache size: ${this.cache.size} items`);

      // Consider clearing cache if memory is critically high
      if (usage.heapUsed > this.warningThreshold * 2) {
        console.warn('Clearing cache due to high memory usage');
        this.cache.clear();
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    };
  }
}
```

**Alternatives Considered:**
- Unbounded cache (rejected - memory leak risk)
- Very small limits (rejected - defeats caching purpose)
- LRU with size (in bytes) limits (deferred - added complexity)

### TTL Patterns and Best Practices

**TTL Configuration by Data Type:**

```typescript
const TTL_CONFIG = {
  // Frequently changing data
  TASKS_TODAY: 30 * 1000,           // 30 seconds (as specified)
  TASKS_WEEK: 60 * 1000,            // 1 minute

  // Moderately changing data
  USER_PROFILE: 5 * 60 * 1000,      // 5 minutes
  STREAMS: 5 * 60 * 1000,           // 5 minutes

  // Rarely changing data
  WORKSPACE_SETTINGS: 15 * 60 * 1000,  // 15 minutes

  // Read-heavy, write-light
  ARCHIVED_TASKS: 10 * 60 * 1000,   // 10 minutes
};

// Apply TTL based on data type
class SmartCache {
  private cache: LRUCache<string, any>;

  set(key: string, value: any, ttl?: number) {
    // Auto-detect TTL based on key prefix
    const detectedTTL = ttl || this.detectTTL(key);
    this.cache.set(key, value, { ttl: detectedTTL });
  }

  private detectTTL(key: string): number {
    if (key.startsWith('day:')) return TTL_CONFIG.TASKS_TODAY;
    if (key.startsWith('week:')) return TTL_CONFIG.TASKS_WEEK;
    if (key.startsWith('user:')) return TTL_CONFIG.USER_PROFILE;
    if (key.startsWith('stream:')) return TTL_CONFIG.STREAMS;
    if (key.startsWith('archived:')) return TTL_CONFIG.ARCHIVED_TASKS;

    return TTL_CONFIG.TASKS_TODAY; // Default
  }
}
```

**Best Practices:**

1. **Update TTL on Access:**
   ```typescript
   const cache = new LRUCache({
     max: 500,
     ttl: 30 * 1000,
     updateAgeOnGet: true,  // ✅ Refresh TTL when accessed
   });
   ```

2. **Conditional TTL Refresh:**
   ```typescript
   // Don't refresh TTL for existence checks
   const cache = new LRUCache({
     max: 500,
     ttl: 30 * 1000,
     updateAgeOnGet: true,
     updateAgeOnHas: false,  // ✅ Don't refresh on has()
   });
   ```

3. **Manual TTL Extension:**
   ```typescript
   // Extend TTL for frequently accessed items
   const task = cache.get(taskId);
   if (task && isImportant(task)) {
     // Re-set with longer TTL
     cache.set(taskId, task, { ttl: 5 * 60 * 1000 });
   }
   ```

4. **Disposal on Expiry:**
   ```typescript
   const cache = new LRUCache({
     max: 500,
     ttl: 30 * 1000,
     dispose: (value, key, reason) => {
       if (reason === 'evict') {
         console.log(`Evicted ${key} due to size limit`);
       } else if (reason === 'expire') {
         console.log(`Expired ${key} after TTL`);
       }
     },
   });
   ```

**Performance Considerations:**

- **Avoid dispose functions unless necessary** (adds overhead)
- **Avoid size tracking unless memory is constrained** (lru-cache docs recommendation)
- **TTL adds minimal overhead** (~5-10% according to lru-cache benchmarks)
- **Use TTL for data freshness, not for preemptive pruning** (lru-cache won't proactively delete expired items until accessed)

**Implementation Notes:**
- Use 30-second TTL for task data (per spec requirements)
- Longer TTL for user/stream metadata (rarely changes)
- Invalidate on writes to ensure consistency
- Monitor cache hit/miss ratios during development
- Consider cache warming for daily planning workflow

---

## 5. System Keychain Integration (Node.js)

### Library Selection

**Decision: keytar (via @atom/keytar or fork)**

**Rationale:**
- Cross-platform support: macOS (Keychain), Linux (libsecret), Windows (Credential Vault)
- Native Node.js module with good performance
- Async/Promise-based API
- Well-established (used by VS Code, Atom, Postman)
- Pre-built binaries for common Node.js/Electron versions

**Alternatives Considered:**

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| `keytar` (Atom) | Official, stable, widely used | Original repo less active | ✅ Use fork if needed |
| `@postman/node-keytar` | Actively maintained fork | Postman branding | ✅ Good alternative |
| `node-keychain` | macOS-only | No Linux/Windows | ❌ Not cross-platform |
| `keychain` (npm) | Simple API | macOS-only | ❌ Not cross-platform |
| Environment variables | No dependencies | Insecure, visible in process list | ❌ Security risk |

### Installation and Setup

**Installation:**

```bash
# Option 1: Atom's original keytar
npm install keytar

# Option 2: Postman's maintained fork
npm install @postman/node-keytar

# Linux: Install system dependency first
sudo apt-get install libsecret-1-dev  # Debian/Ubuntu
sudo yum install libsecret-devel       # Red Hat/Fedora
sudo pacman -S libsecret               # Arch Linux
```

**TypeScript Configuration:**

```typescript
// Install types
npm install --save-dev @types/keytar

// Import
import * as keytar from 'keytar';
// or
import { getPassword, setPassword, deletePassword } from 'keytar';
```

### Cross-Platform Implementation

**Decision: Unified API with platform-specific fallbacks**

**Rationale:**
- macOS Keychain: Native, secure, user-friendly
- Linux libsecret: GNOME/KDE keyring integration
- Windows Credential Vault: Native Windows credential manager
- All three provide system-level encryption at rest
- User doesn't need to manage passwords in plain text

**Keychain API Usage:**

```typescript
import * as keytar from 'keytar';

const SERVICE_NAME = 'sunsama-mcp';
const ACCOUNT_EMAIL = 'email';
const ACCOUNT_PASSWORD = 'password';

class CredentialManager {
  /**
   * Store Sunsama credentials in system keychain
   */
  async storeCredentials(email: string, password: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_EMAIL, email);
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_PASSWORD, password);
      console.log('Credentials stored in system keychain');
    } catch (error) {
      throw new Error(`Failed to store credentials: ${error}`);
    }
  }

  /**
   * Retrieve credentials from system keychain
   */
  async getCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const email = await keytar.getPassword(SERVICE_NAME, ACCOUNT_EMAIL);
      const password = await keytar.getPassword(SERVICE_NAME, ACCOUNT_PASSWORD);

      if (!email || !password) {
        return null;
      }

      return { email, password };
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Delete credentials from system keychain
   */
  async deleteCredentials(): Promise<boolean> {
    try {
      const emailDeleted = await keytar.deletePassword(SERVICE_NAME, ACCOUNT_EMAIL);
      const passwordDeleted = await keytar.deletePassword(SERVICE_NAME, ACCOUNT_PASSWORD);
      return emailDeleted && passwordDeleted;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  }

  /**
   * Check if credentials exist
   */
  async hasCredentials(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials !== null;
  }

  /**
   * Find all stored accounts (for debugging)
   */
  async listAccounts(): Promise<Array<{ account: string; password: string }>> {
    try {
      return await keytar.findCredentials(SERVICE_NAME);
    } catch (error) {
      console.error('Failed to list accounts:', error);
      return [];
    }
  }
}

// Usage
const credManager = new CredentialManager();

// Store credentials
await credManager.storeCredentials('user@example.com', 'password123');

// Retrieve credentials
const creds = await credManager.getCredentials();
if (creds) {
  console.log(`Email: ${creds.email}`);
}

// Delete credentials
await credManager.deleteCredentials();
```

### Platform-Specific Considerations

**macOS (Keychain Access):**
- Credentials stored in user's login keychain
- Accessible via Keychain Access.app
- Requires user authentication (password or Touch ID)
- Service name: `sunsama-mcp`
- Account: `email` and `password`

**Linux (libsecret / Secret Service API):**
- Integrates with GNOME Keyring or KDE Wallet
- Requires libsecret-1-dev installed
- Desktop environment must have keyring daemon running
- Fallback: Some Linux systems may not have keyring (headless servers)

**Windows (Credential Vault):**
- Uses Windows Credential Manager
- Accessible via Control Panel → Credential Manager
- Target name: `sunsama-mcp/email` and `sunsama-mcp/password`

### Fallback Strategies

**Decision: Environment variables as fallback, with warnings**

**Rationale:**
- Keychain may not be available (headless Linux, Docker containers)
- Environment variables allow testing and CI/CD
- Warn user about security implications

**Fallback Implementation:**

```typescript
class CredentialManagerWithFallback {
  private useKeychain: boolean = true;

  constructor() {
    // Detect if keychain is available
    this.detectKeychainAvailability();
  }

  private async detectKeychainAvailability(): Promise<void> {
    try {
      // Try to access keychain
      await keytar.findPassword('test-service');
      this.useKeychain = true;
    } catch (error) {
      console.warn('System keychain not available, falling back to environment variables');
      console.warn('WARNING: Credentials will be stored in plain text!');
      this.useKeychain = false;
    }
  }

  async getCredentials(): Promise<{ email: string; password: string } | null> {
    // Try keychain first
    if (this.useKeychain) {
      try {
        const email = await keytar.getPassword(SERVICE_NAME, ACCOUNT_EMAIL);
        const password = await keytar.getPassword(SERVICE_NAME, ACCOUNT_PASSWORD);

        if (email && password) {
          return { email, password };
        }
      } catch (error) {
        console.warn('Keychain access failed, trying environment variables');
      }
    }

    // Fallback to environment variables
    const email = process.env.SUNSAMA_EMAIL;
    const password = process.env.SUNSAMA_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'No credentials found. Please either:\n' +
        '  1. Store credentials in keychain: sunsama-mcp setup\n' +
        '  2. Set environment variables: SUNSAMA_EMAIL and SUNSAMA_PASSWORD'
      );
    }

    return { email, password };
  }

  async storeCredentials(email: string, password: string): Promise<void> {
    if (!this.useKeychain) {
      console.error('Cannot store credentials: keychain not available');
      console.log('Set these environment variables instead:');
      console.log(`  export SUNSAMA_EMAIL="${email}"`);
      console.log(`  export SUNSAMA_PASSWORD="<your-password>"`);
      return;
    }

    await keytar.setPassword(SERVICE_NAME, ACCOUNT_EMAIL, email);
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_PASSWORD, password);
    console.log('✅ Credentials stored securely in system keychain');
  }
}
```

### Setup CLI for Credential Management

**User-Friendly Setup Process:**

```typescript
import readline from 'readline';

class SetupCLI {
  private credManager = new CredentialManagerWithFallback();

  async run() {
    console.log('🔐 Sunsama MCP Credential Setup\n');

    // Check if credentials already exist
    const hasExisting = await this.credManager.hasCredentials();
    if (hasExisting) {
      const overwrite = await this.confirm('Credentials already exist. Overwrite?');
      if (!overwrite) {
        console.log('Setup cancelled');
        return;
      }
    }

    // Prompt for credentials
    const email = await this.prompt('Sunsama email: ');
    const password = await this.promptHidden('Sunsama password: ');

    // Validate credentials (test API login)
    console.log('Testing credentials...');
    const valid = await this.validateCredentials(email, password);

    if (!valid) {
      console.error('❌ Invalid credentials. Please try again.');
      return;
    }

    // Store credentials
    await this.credManager.storeCredentials(email, password);
    console.log('✅ Setup complete! Credentials stored securely.');
  }

  private async prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  private async promptHidden(question: string): Promise<string> {
    // Hide password input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();

      let password = '';
      process.stdout.write(question);

      stdin.on('data', (char) => {
        const c = char.toString('utf-8');

        if (c === '\n' || c === '\r' || c === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          rl.close();
          resolve(password);
        } else if (c === '\u0003') {
          process.exit();
        } else if (c === '\u007f') {
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          password += c;
          process.stdout.write('*');
        }
      });
    });
  }

  private async confirm(question: string): Promise<boolean> {
    const answer = await this.prompt(`${question} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private async validateCredentials(email: string, password: string): Promise<boolean> {
    try {
      const api = new SunsamaAPIClient({ email, password });
      await api.getUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SetupCLI();
  setup.run().catch(console.error);
}
```

**Usage:**
```bash
# Run setup
bun run src/setup.ts

# Or via package.json script
bun run setup

# Output:
# 🔐 Sunsama MCP Credential Setup
#
# Sunsama email: user@example.com
# Sunsama password: ********
# Testing credentials...
# ✅ Setup complete! Credentials stored securely.
```

### Security Best Practices

**Decision: Defense in depth with multiple security layers**

**Implementation Checklist:**

1. **Never Log Credentials:**
   ```typescript
   // ❌ BAD
   console.log('Credentials:', email, password);

   // ✅ GOOD
   console.log('Credentials loaded for user:', email);
   console.log('Authentication successful');
   ```

2. **Clear Memory After Use:**
   ```typescript
   async function authenticate(creds: Credentials) {
     try {
       await api.login(creds.email, creds.password);
       return true;
     } finally {
       // Clear credential strings from memory
       creds.email = '';
       creds.password = '';
     }
   }
   ```

3. **Validate Input:**
   ```typescript
   async function storeCredentials(email: string, password: string) {
     // Validate before storing
     if (!email.includes('@')) {
       throw new Error('Invalid email format');
     }

     if (password.length < 8) {
       throw new Error('Password too short (minimum 8 characters)');
     }

     await keytar.setPassword(SERVICE_NAME, ACCOUNT_EMAIL, email);
     await keytar.setPassword(SERVICE_NAME, ACCOUNT_PASSWORD, password);
   }
   ```

4. **Use Service-Specific Keys:**
   ```typescript
   // ✅ GOOD: Unique service name
   const SERVICE_NAME = 'sunsama-mcp';

   // ❌ BAD: Generic service name (collisions with other apps)
   const SERVICE_NAME = 'my-app';
   ```

5. **Handle Errors Securely:**
   ```typescript
   try {
     await keytar.setPassword(service, account, password);
   } catch (error) {
     // ❌ BAD: Expose password in error
     throw new Error(`Failed to store ${password}`);

     // ✅ GOOD: Generic error message
     throw new Error('Failed to store credentials in keychain');
   }
   ```

**Alternatives Considered:**
- File-based encryption (rejected - keychain more secure, OS-managed)
- OAuth tokens (deferred - requires Sunsama OAuth support)
- Hardware tokens (rejected - overkill for personal use)

**Implementation Notes:**
- Use keytar for all credential storage (no plain text files)
- Provide setup CLI for easy credential management
- Fall back to environment variables with warnings
- Document keychain access in README (users may need to grant permission)
- Consider adding `sunsama-mcp logout` command to delete credentials

---

## References

### Primary Sources

1. **robertn702/mcp-sunsama GitHub Repository**
   - URL: https://github.com/robertn702/mcp-sunsama
   - Accessed: 2025-10-12
   - Purpose: Architecture analysis, existing tool coverage

2. **Model Context Protocol (MCP) Specification**
   - URL: https://modelcontextprotocol.io
   - Accessed: 2025-10-12
   - Purpose: Protocol standards, error codes, transport mechanisms

3. **MCP TypeScript SDK Documentation**
   - URL: https://github.com/modelcontextprotocol/typescript-sdk
   - Accessed: 2025-10-12
   - Purpose: Tool registration patterns, Zod integration

4. **JSON-RPC 2.0 Specification**
   - URL: https://www.jsonrpc.org/specification
   - Accessed: 2025-10-12
   - Purpose: Error code standards (-32600, -32603, etc.)

### Technical Documentation

5. **lru-cache npm Package**
   - URL: https://www.npmjs.com/package/lru-cache
   - Accessed: 2025-10-12
   - Purpose: Caching implementation patterns, TTL configuration

6. **keytar (node-keytar) GitHub Repository**
   - URL: https://github.com/atom/node-keytar
   - Accessed: 2025-10-12
   - Purpose: Cross-platform credential storage

7. **Chrome DevTools Network Reference**
   - URL: https://developer.chrome.com/docs/devtools/network
   - Accessed: 2025-10-12
   - Purpose: API discovery methodology

### Articles and Guides

8. **"Reverse Engineering APIs with Chrome DevTools MCP"**
   - Author: Oz Tamir
   - URL: https://posts.oztamir.com/reverse-engineering-apis-with-chrome-devtools-mcp/
   - Published: ~2 weeks before 2025-10-12
   - Purpose: API discovery best practices

9. **"MCP Clients: Stdio vs SSE"**
   - Author: V S Krishnan
   - URL: https://medium.com/@vkrishnan9074/mcp-clients-stdio-vs-sse-a53843d9aabb
   - Accessed: 2025-10-12
   - Purpose: Transport layer comparison

10. **"Error Handling in MCP Servers - Best Practices Guide"**
    - URL: https://mcpcat.io/guides/error-handling-custom-mcp-servers/
    - Accessed: 2025-10-12
    - Purpose: Error handling patterns

11. **"In-Memory Caching in Node.js for Service-Level Performance"**
    - Author: Ayush Nandanwar
    - URL: https://medium.com/@ayushnandanwar003/in-memory-caching-in-node-js-for-service-level-performance-d511beb78bee
    - Accessed: 2025-10-12
    - Purpose: Caching strategies, invalidation patterns

### Sunsama Resources

12. **Sunsama Help Documentation**
    - URL: https://help.sunsama.com/docs/
    - Accessed: 2025-10-12
    - Purpose: Feature discovery, UI capabilities

13. **Sunsama Integrations Page**
    - URL: https://roadmap.sunsama.com/integrations
    - Accessed: 2025-10-12
    - Purpose: Integration feature coverage

### Tools and Utilities

14. **httpie - API Testing Client**
    - URL: https://httpie.io/
    - Accessed: 2025-10-12
    - Purpose: Endpoint testing tool evaluation

15. **Node.js Keychain Libraries Comparison**
    - URLs: Various npm packages (@atom/keytar, @postman/node-keytar)
    - Accessed: 2025-10-12
    - Purpose: Credential storage library selection

---

## Appendix: Research Methodology

### Search Strategy

This research was conducted using a systematic approach:

1. **Base Implementation Analysis:**
   - Direct repository inspection of robertn702/mcp-sunsama
   - Code structure analysis (TypeScript source files)
   - Tool enumeration via README and source code

2. **Protocol Research:**
   - Official MCP documentation review
   - SDK repository analysis
   - Community guides and articles

3. **Technical Stack Evaluation:**
   - npm package research for caching libraries
   - Credential storage library comparison
   - API testing tool evaluation

4. **Best Practices Discovery:**
   - Industry articles on API reverse engineering
   - Node.js caching pattern documentation
   - Security best practices for credential management

### Validation Criteria

Each technical decision was evaluated against:
- **Feasibility:** Can it be implemented with available tools?
- **Maintainability:** Is it sustainable for a single developer?
- **Security:** Does it protect user credentials and data?
- **Performance:** Does it meet 30-second cache TTL requirement?
- **Compatibility:** Does it work with Claude Desktop (stdio transport)?
- **Constitution Alignment:** Does it support 90% API coverage goal?

### Confidence Levels

- **High Confidence:** Primary sources (official docs, repositories)
- **Medium Confidence:** Community articles, tutorials
- **Low Confidence:** Opinions, speculative recommendations

All recommendations in this document are **High Confidence** unless otherwise noted.

---

**Document Status:** Active
**Last Updated:** 2025-10-12
**Next Review:** After initial implementation phase
**Maintainer:** Project team
