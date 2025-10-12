# Sunsama MCP Tool Contract Schemas

This directory contains JSON Schema definitions for the Sunsama MCP server tool contracts.

## Files

### 1. task-tools.json (26KB)
**Purpose**: Task CRUD operation contracts

**Contains 13 MCP tools**:
- `get-tasks-by-day` - Retrieve tasks for specific date (FR-001)
- `get-tasks-backlog` - Retrieve backlog tasks with pagination (FR-002, FR-005)
- `get-archived-tasks` - Retrieve archived tasks with date range (FR-003, FR-005)
- `get-task-by-id` - Retrieve single task details (FR-004)
- `create-task` - Create new task with optional properties (FR-006 through FR-011)
- `update-task-complete` - Mark task complete/incomplete (FR-012)
- `update-task-scheduled-date` - Reschedule or move to backlog (FR-013, FR-014)
- `update-task-notes` - Update notes with append/replace (FR-016)
- `update-task-time-estimate` - Update time estimate (FR-017)
- `update-task-channel` - Update channel/stream assignment (FR-018)
- `update-task-snooze` - Update snooze date (FR-019)
- `update-task-text` - Update task title (FR-015)
- `delete-task` - Permanently delete task (FR-020, FR-021)

**Key Features**:
- JSON-RPC 2.0 error codes (-32602, -32603)
- Zod-compatible schemas for input/output validation
- Comprehensive error case documentation
- Task entity definition with all properties
- Pagination support for list operations
- Intelligent notes merge behavior (append vs replace)

### 2. user-tools.json (7.6KB)
**Purpose**: User profile and metadata operation contracts

**Contains 3 MCP tools**:
- `get-user` - Retrieve user profile and timezone (FR-022, FR-024)
- `get-channels` - Retrieve channels (alias for discoverability) (FR-023)
- `get-streams` - Retrieve streams (Sunsama internal terminology) (FR-023)

**Key Features**:
- User entity with timezone, preferences, groups
- Channel/Stream entity with type, color, icon, integration source
- Support for workspaces/group memberships
- Working hours and week start preferences

### 3. coverage-matrix.json (21KB)
**Purpose**: API coverage tracking and implementation status

**Contains**:
- **Endpoint Coverage**: 12 discovered API endpoints with status tracking
  - 8 implemented endpoints
  - 1 partial implementation (unified update endpoint)
  - 2 discovered but not analyzed (calendar events, rituals)
  - 1 explicitly excluded (recurring tasks)
  
- **Feature Coverage**: 10 Sunsama UI features with coverage levels
  - 5 features with full coverage (Daily Planning, Backlog, Notes, Channels, Archive)
  - 1 feature with high coverage (Task Timeboxing - 75-99%)
  - 4 features with no coverage (Calendar, Recurring Tasks, Rituals, Third-Party Integrations)

- **Coverage Summary**:
  - Current endpoint coverage: 75%
  - Current feature coverage: 70%
  - Target coverage: 90%
  - Status: Target not yet met

**Status Definitions**:
- `implemented` - Fully implemented with tests and docs
- `partial` - Missing some features or edge cases
- `planned` - Not implemented but on roadmap
- `discovered` - Found but not analyzed
- `experimental` - Implemented but behavior uncertain
- `not-planned` - Explicitly excluded from scope

## Schema Standards

All schemas follow:
- **JSON Schema Draft 07** specification
- **MCP Protocol** conventions for tool registration
- **JSON-RPC 2.0** error handling standards
- **ISO 8601** date/datetime formats
- **IANA timezone** identifiers

## Mapping to Specification

### Functional Requirements Coverage
- **FR-001 to FR-024**: All covered by task and user tools
- **FR-025 to FR-028**: Implemented via coverage-matrix.json tracking
- **FR-029 to FR-035**: Error handling specified in errorCases
- **FR-036 to FR-041**: Authentication/security (implementation level)

### User Stories Coverage
- **US1** (Daily Planning): 7 tools - full coverage
- **US2** (Backlog Management): 4 tools - full coverage
- **US3** (Task Timeboxing): 2 tools - high coverage (missing active tracking)
- **US4** (Task Notes): 2 tools - full coverage
- **US5** (Channel Organization): 4 tools - full coverage
- **US6** (Archived History): 1 tool - full coverage

## Usage

These schemas serve as:
1. **Implementation contracts** for MCP tool development
2. **Validation schemas** for runtime input/output checking
3. **API documentation** for developers and AI assistants
4. **Coverage tracking** for implementation progress

## MCP Protocol Compliance

All tools comply with:
- Tool name conventions (kebab-case, verb-noun pattern)
- Input/output schema structure
- Error response format (JSON-RPC codes)
- Description patterns for AI discoverability

## References

- Feature Spec: `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/spec.md`
- Research: `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/research.md`
- MCP Protocol: https://modelcontextprotocol.io
- JSON Schema: http://json-schema.org/draft-07/schema

---

**Created**: 2025-10-12  
**Version**: 1.0.0  
**Status**: Draft
