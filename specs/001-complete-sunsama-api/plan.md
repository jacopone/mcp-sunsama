# Implementation Plan: Complete Sunsama API Coverage

**Branch**: `001-complete-sunsama-api` | **Date**: 2025-10-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-complete-sunsama-api/spec.md`

**Note**: This is a standalone MCP server implementation leveraging the robertn702/sunsama-api TypeScript library for API access. Architecture evolved from initial "extend robertn702/mcp-sunsama" concept to a clean consolidated implementation.

## Summary

Extend the existing robertn702/mcp-sunsama MCP server to provide complete coverage of Sunsama's task management API, enabling AI assistants to fully manage daily planning workflows through natural language. The implementation will discover and expose undocumented Sunsama API endpoints through browser DevTools network inspection, implement them with proper TypeScript typing and Zod validation, and maintain a coverage matrix tracking implementation status against web UI features. Primary focus on P1 daily planning workflow (task CRUD), P2 backlog/timeboxing features, and P3 organization/history features, with aggressive caching (30s TTL) and resilient error handling for the undocumented API.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Runtime schema validation
- `sunsama-api` (robertn702/sunsama-api) - TypeScript wrapper for Sunsama API with built-in authentication
- `lru-cache` - LRU cache implementation with TTL support
- `luxon` - Timezone-aware date handling

**Authentication**: Uses `sunsama-api` library's built-in email/password authentication. Credentials provided via environment variables (SUNSAMA_EMAIL, SUNSAMA_PASSWORD) for stdio transport or HTTP Basic Auth for HTTP transport.

**Storage**: In-memory cache with 30-second TTL, no persistent database (personal use, single session)

**Testing**:
- `vitest` or `jest` - Unit testing framework
- Manual integration testing against live Sunsama account (dedicated test workspace)
- No mocking of Sunsama API (too brittle for undocumented endpoints)

**Target Platform**: Linux/macOS desktop environment running MCP clients (Claude Desktop, Cursor)

**Project Type**: Single project - MCP server extending existing implementation

**Performance Goals**:
- <2s for cached task retrieval
- <5s for fresh API calls
- <3s startup time
- <100MB memory footprint

**Constraints**:
- Must maintain compatibility with robertn702/mcp-sunsama architecture
- Must work with undocumented Sunsama API (subject to breaking changes)
- Personal use only (single user, no multi-tenant complexity)
- Aggressive cache invalidation (30s + bypass on writes)

**Scale/Scope**:
- Single user workload
- ~100-200 tasks typical daily/backlog volume
- 6 user stories (3 P1/P2, 3 P3)
- 41 functional requirements
- Target: 90% web UI feature coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Complete API Coverage ✅

- **Requirement**: Maintain coverage matrix tracking implemented vs. discovered endpoints
- **Implementation**: Create `COVERAGE_MATRIX.md` documenting:
  - Discovered Sunsama API endpoints (via DevTools network inspection)
  - Implementation status (full/partial/experimental/not-implemented)
  - Web UI features supported by each endpoint
  - Known limitations or gaps
- **Verification**: Coverage matrix updated with each new endpoint, target 90% feature parity with web UI

### Principle II: MCP Protocol Compliance ✅

- **Requirement**: Strict MCP protocol adherence for all tools and resources
- **Implementation**:
  - All MCP tools use JSON Schema for input validation (Zod → JSON Schema conversion)
  - Error responses use MCP standard error codes (`-32600` invalid request, `-32603` internal error, etc.)
  - Tool descriptions follow MCP conventions
  - Transport layer uses stdio (existing robertn702 pattern)
- **Verification**: Test with multiple MCP clients (Claude Desktop, Cursor) to ensure compatibility

### Principle III: Resilient Error Handling (NON-NEGOTIABLE) ✅

- **Requirement**: Graceful handling of undocumented API changes with retry logic
- **Implementation**:
  - Wrap all Sunsama API calls in try-catch with exponential backoff retry (max 3 attempts)
  - Schema validation on all responses (Zod schemas)
  - Version tagging in logs to detect silent API changes
  - Actionable error messages (e.g., "Task creation failed: Sunsama API returned 400 - check task title length")
- **Verification**: Unit tests for error scenarios, manual testing of network failures

### Principle IV: Personal Use Optimization ✅

- **Requirement**: Aggressive caching and single-user optimizations
- **Implementation**:
  - In-memory cache with 30-second TTL for read operations
  - Bypass cache on all write operations (create/update/delete)
  - No multi-user session management complexity
  - Prefetch today's tasks on server startup (optional optimization)
- **Verification**: Performance testing with cache hit/miss scenarios, verify <2s cached retrieval

### Principle V: Maintainability & Documentation ✅

- **Requirement**: Document API discovery process and request/response examples
- **Implementation**:
  - `docs/api-discovery.md` - Process for discovering new endpoints via DevTools
  - `docs/endpoints/` - Directory with markdown files per endpoint containing:
    - Example request (curl command)
    - Example response (JSON)
    - TypeScript types
    - Known quirks or edge cases
  - API change log tracking Sunsama version → breaking changes
- **Verification**: Each new endpoint has documentation with examples before implementation

### Gate Status: ✅ PASS

No violations. All constitution principles have clear implementation strategies.

## Project Structure

### Documentation (this feature)

```
specs/001-complete-sunsama-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output - API discovery research
├── data-model.md        # Phase 1 output - Entity definitions
├── quickstart.md        # Phase 1 output - Developer setup guide
├── contracts/           # Phase 1 output - MCP tool schemas
│   ├── task-tools.json     # Task CRUD tool schemas
│   ├── user-tools.json     # User/metadata tool schemas
│   └── coverage-matrix.json # API coverage tracking schema
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

Based on robertn702/mcp-sunsama structure, this project extends existing architecture:

```
src/
├── main.ts              # MCP server entry point
├── schemas.ts           # Zod schemas for tool parameter validation
├── tools/               # MCP tool handlers (consolidated)
│   ├── task-tools.ts       # Task CRUD, backlog, timeboxing, notes (16 tools consolidated)
│   ├── user-tools.ts       # User/metadata operations (get-user)
│   ├── stream-tools.ts     # Channel/stream operations (get-streams)
│   ├── task-helpers.ts     # Shared helper functions with caching
│   ├── shared.ts           # Common utilities and patterns
│   └── index.ts            # Export all tools
├── services/            # Business logic layer
│   ├── sunsama-client.ts   # Resilient client wrapper with retry logic
│   ├── cache.ts            # LRU cache service with TTL (30s tasks, 5min user/streams)
│   └── schema-validator.ts # Zod validation for API responses
├── models/              # TypeScript types and Zod schemas
│   ├── task.ts             # Task type (from sunsama-api) + helpers
│   ├── user.ts             # User schema with Zod validation
│   └── channel.ts          # Channel/Stream schema with Zod
├── config/              # Configuration modules
│   ├── cache-config.ts     # Cache TTL constants
│   ├── transport.ts        # Transport mode configuration
│   └── session-config.ts   # Session TTL configuration
├── auth/                # Authentication strategies
│   ├── stdio.ts            # Stdio transport authentication
│   ├── http.ts             # HTTP Basic Auth parsing
│   └── types.ts            # Shared auth types
├── transports/          # MCP transport implementations
│   ├── stdio.ts            # Stdio transport (default)
│   └── http.ts             # HTTP Stream transport with session management
├── session/
│   └── session-manager.ts  # Session lifecycle management
├── resources/
│   └── index.ts            # API documentation resource
└── utils/
    ├── errors.ts           # Custom error classes
    ├── error-handler.ts    # Exponential backoff retry logic
    ├── date-utils.ts       # Timezone-aware date utilities (Luxon)
    ├── coverage-tracker.ts # API usage monitoring
    ├── client-resolver.ts  # Transport-agnostic client resolution
    ├── task-filters.ts     # Task completion filtering
    ├── task-trimmer.ts     # Response size optimization
    └── to-tsv.ts           # TSV formatting utilities

tests/
├── unit/                # Unit tests
│   ├── services/           # Service layer tests
│   ├── tools/              # Tool handler tests
│   └── utils/              # Utility function tests
└── integration/         # Integration tests against live Sunsama account
    ├── daily-planning.test.ts    # P1 workflow tests
    ├── backlog.test.ts           # P2 backlog tests
    └── timeboxing.test.ts        # P2 timeboxing tests

docs/
├── api-discovery.md     # API discovery process documentation
├── endpoints/           # Per-endpoint documentation with examples
│   ├── get-tasks-by-day.md
│   ├── create-task.md
│   ├── update-task.md
│   └── ...
├── COVERAGE_MATRIX.md   # Web UI feature → API endpoint mapping
└── API_CHANGELOG.md     # Sunsama API change history

package.json             # Extend existing dependencies
tsconfig.json            # Extend existing TypeScript config
```

**Structure Decision**: Standalone MCP server leveraging robertn702/sunsama-api library. Rationale: Clean consolidated architecture with 3 tool files (task-tools, user-tools, stream-tools) instead of 5+ separate files improves maintainability. All task operations consolidated into task-tools.ts with shared helpers in task-helpers.ts. Authentication handled by sunsama-api library. Dual transport support (stdio + HTTP) for flexibility. No frontend/backend split as this is MCP protocol only.

## Complexity Tracking

*No violations - this section is empty.*

All constitution principles are satisfied without requiring complexity justifications. The extension approach (building on robertn702/mcp-sunsama) avoids reinventing MCP protocol implementation, authentication, and basic task operations.
