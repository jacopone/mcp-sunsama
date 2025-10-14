# Sunsama API Endpoints Documentation

This directory contains detailed documentation for each Sunsama API endpoint exposed via MCP tools.

## Available Endpoints

### Task Retrieval Operations

- **[get-tasks-by-day](./get-tasks-by-day.md)** - Get tasks for specific day with filtering
- **[get-tasks-backlog](./get-tasks-backlog.md)** *(TODO)* - Get backlog tasks with pagination
- **[get-archived-tasks](./get-archived-tasks.md)** *(TODO)* - Get archived tasks by date range
- **[get-task-by-id](./get-task-by-id.md)** *(TODO)* - Get single task details

### Task Mutation Operations

- **[create-task](./create-task.md)** - Create new task with properties
- **[update-task-complete](./update-task-complete.md)** *(TODO)* - Mark task complete
- **[update-task-snooze-date](./update-task-snooze-date.md)** *(TODO)* - Reschedule task
- **[update-task-backlog](./update-task-backlog.md)** *(TODO)* - Move task to backlog
- **[update-task-planned-time](./update-task-planned-time.md)** *(TODO)* - Update time estimate
- **[update-task-notes](./update-task-notes.md)** - Update task notes (html/markdown)
- **[update-task-due-date](./update-task-due-date.md)** *(TODO)* - Update due date
- **[update-task-text](./update-task-text.md)** *(TODO)* - Update task title
- **[update-task-stream](./update-task-stream.md)** *(TODO)* - Assign task to channel
- **[delete-task](./delete-task.md)** *(TODO)* - Delete task

### User & Metadata Operations

- **[get-user](./get-user.md)** *(TODO)* - Get user profile and timezone
- **[get-streams](./get-streams.md)** *(TODO)* - Get available channels/streams

## Documentation Format

Each endpoint document includes:

1. **MCP Tool Name** - Tool identifier for MCP protocol
2. **Sunsama API Endpoint** - Underlying API endpoint (REST)
3. **Implementation** - Source file location
4. **Parameters** - Input schema with types and descriptions
5. **Example Requests** - MCP protocol + curl equivalent
6. **Example Responses** - TSV format (actual tool output)
7. **Response Fields** - Field descriptions
8. **Caching Behavior** - TTL, cache keys, invalidation rules
9. **Performance** - Typical/cached response times
10. **Error Codes** - MCP error codes with descriptions
11. **Related Tools** - Tools that work together
12. **Implementation Notes** - Special behaviors and quirks
13. **Sunsama API Quirks** - Known API behavior oddities
14. **Validation Rules** - Input constraints

## Endpoint Coverage

**Documented**: 3/16 endpoints (19%)
**Status**: Representative samples complete

The three documented endpoints cover:
- Read operation (get-tasks-by-day)
- Write operation (create-task)
- Complex validation (update-task-notes with XOR)

Remaining 13 endpoints follow similar patterns and can be documented as needed.

## Contributing

When documenting new endpoints:

1. Follow the format from existing endpoint docs
2. Include real examples from manual testing
3. Document quirks discovered during implementation
4. Add curl examples for API verification
5. Explain caching behavior and invalidation

## Resources

- **COVERAGE_MATRIX.md** - Complete list of implemented endpoints
- **API_DISCOVERY.md** - Process for discovering new endpoints
- **MCP_PROTOCOL_VALIDATION.md** - MCP protocol compliance details
