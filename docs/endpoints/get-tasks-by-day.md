# Endpoint: get-tasks-by-day

**MCP Tool**: `get-tasks-by-day`
**Sunsama API**: `GET /api/v1/tasks/day/:date`
**Implementation**: src/tools/task-tools.ts:69

## Description

Retrieve all tasks scheduled for a specific day with optional completion status filtering.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `day` | string | Yes | Date in YYYY-MM-DD format |
| `timezone` | string | No | Timezone (e.g., 'America/New_York'). Defaults to user's timezone |
| `completionFilter` | enum | No | Filter: 'all', 'incomplete', 'completed'. Defaults to 'all' |

## Example Request (MCP Protocol)

```json
{
  "method": "tools/call",
  "params": {
    "name": "get-tasks-by-day",
    "arguments": {
      "day": "2025-10-12",
      "timezone": "America/New_York",
      "completionFilter": "incomplete"
    }
  }
}
```

## Example Request (curl equivalent to Sunsama API)

```bash
curl -X GET "https://api.sunsama.com/api/v1/tasks/day/2025-10-12" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

## Example Response (TSV format)

```
id	text	completed	scheduledDate	dueDate	timeEstimate	streamId	notes
task_abc123	Review Q4 budget	false	2025-10-12	2025-10-15	3600	stream_xyz	Check with finance team
task_def456	Team standup	true	2025-10-12		1800	stream_xyz
task_ghi789	Code review PR #42	false	2025-10-12		1200		Fix security issues
```

## Response Fields

- `id`: Unique task identifier
- `text`: Task title/description
- `completed`: Boolean completion status
- `scheduledDate`: Date task is scheduled (YYYY-MM-DD)
- `dueDate`: Optional due date (YYYY-MM-DD)
- `timeEstimate`: Planned time in seconds (null if not set)
- `streamId`: Channel/stream assignment (null if not assigned)
- `notes`: Task notes in markdown/html

## Caching Behavior

- **Cache TTL**: 30 seconds
- **Cache Key**: `tasks:day:${day}:${completionFilter}`
- **Invalidation**: Automatic on task create/update/delete for that day

## Performance

- **Cached**: <100ms (typical)
- **Uncached**: 1-2s (Sunsama API latency)

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| -32602 | Invalid params | Invalid date format or completion filter |
| -32603 | Internal error | Sunsama API error or network failure |
| -32001 | Authentication failed | Invalid credentials |

## Example Error Response

```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params: Day must be in YYYY-MM-DD format"
  }
}
```

## Related Tools

- `get-task-by-id` - Get single task details
- `create-task` - Create new task for specific day
- `update-task-snooze-date` - Reschedule task to different day

## Implementation Notes

- Uses cached user timezone if not specified
- Completion filter applied client-side (Sunsama API returns all)
- TSV format for efficient parsing by AI clients
- Supports pagination via offset/limit (not exposed in MCP tool)

## Sunsama API Quirks

- Date must be in user's timezone (not UTC)
- Returns 200 with empty array if no tasks found
- Includes completed tasks unless filtered client-side
