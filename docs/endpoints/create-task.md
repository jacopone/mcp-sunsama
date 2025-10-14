# Endpoint: create-task

**MCP Tool**: `create-task`
**Sunsama API**: `POST /api/v1/tasks`
**Implementation**: src/tools/task-tools.ts:136

## Description

Create a new task with optional properties like notes, time estimate, due date, and scheduled date.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Task title/description |
| `notes` | string | No | Task notes (markdown or HTML) |
| `streamIds` | array | No | Array of stream IDs to assign task |
| `timeEstimate` | number | No | Time estimate in minutes (positive integer) |
| `dueDate` | string | No | Due date (ISO format: YYYY-MM-DDTHH:mm:ssZ) |
| `snoozeUntil` | string | No | Scheduled date (ISO format: YYYY-MM-DDTHH:mm:ssZ) |
| `private` | boolean | No | Whether task is private |
| `taskId` | string | No | Custom task ID (auto-generated if omitted) |

## Example Request (MCP Protocol)

```json
{
  "method": "tools/call",
  "params": {
    "name": "create-task",
    "arguments": {
      "text": "Review Q4 budget",
      "notes": "Check with finance team about expenses",
      "timeEstimate": 60,
      "snoozeUntil": "2025-10-12T14:00:00Z",
      "dueDate": "2025-10-15T23:59:59Z",
      "streamIds": ["stream_xyz"],
      "private": false
    }
  }
}
```

## Example Request (curl equivalent to Sunsama API)

```bash
curl -X POST "https://api.sunsama.com/api/v1/tasks" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Review Q4 budget",
    "notes": "Check with finance team about expenses",
    "timeEstimate": 3600,
    "snoozeUntil": "2025-10-12T14:00:00.000Z",
    "dueDate": "2025-10-15T23:59:59.000Z",
    "streamIds": ["stream_xyz"],
    "private": false
  }'
```

## Example Response (TSV format)

```
id	text	completed	scheduledDate	dueDate	timeEstimate	streamId	notes	createdAt
task_abc123	Review Q4 budget	false	2025-10-12	2025-10-15	3600	stream_xyz	Check with finance team about expenses	2025-10-12T10:30:00Z
```

## Response Fields

- `id`: Auto-generated unique task identifier
- `text`: Task title as provided
- `completed`: false (newly created tasks are incomplete)
- `scheduledDate`: Parsed from `snoozeUntil` parameter
- `dueDate`: As provided
- `timeEstimate`: Converted to seconds (minutes * 60)
- `streamId`: First stream from `streamIds` array
- `notes`: As provided
- `createdAt`: Server-generated creation timestamp

## Caching Behavior

- **Cache Bypass**: Always bypasses cache (write operation)
- **Invalidation**: Invalidates day cache for scheduled date AND backlog cache

## Performance

- **Typical**: 0.8-1.5s (Sunsama API POST latency)
- **With retry**: Up to 3s (3 attempts with exponential backoff)

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| -32602 | Invalid params | Missing required `text` or invalid parameter format |
| -32603 | Internal error | Sunsama API error or network failure |
| -32001 | Authentication failed | Invalid credentials |

## Example Error Response

```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params: Task text is required"
  }
}
```

## Special Behaviors

### Past Date Warning

When `snoozeUntil` is in the past:
```
⚠️ Warning: Creating task for past date (2025-10-10)
```

### Backlog Task

When `snoozeUntil` is omitted or null:
- Task goes to backlog (not scheduled)
- Backlog cache invalidated

### Time Estimate Conversion

MCP tool accepts minutes, Sunsama API expects seconds:
```
timeEstimate: 60 (minutes) → 3600 (seconds in API)
```

## Related Tools

- `get-tasks-by-day` - Retrieve created task
- `update-task-text` - Update task title
- `update-task-notes` - Update task notes
- `delete-task` - Delete created task

## Implementation Notes

- Auto-generates task ID if not provided (UUID format)
- Converts time estimate from minutes to seconds
- Validates stream IDs exist before creating (optional check)
- Cache invalidation happens after successful creation

## Sunsama API Quirks

- `snoozeUntil` field name is confusing (actually means "scheduled date")
- Time estimates must be in seconds (not minutes)
- `streamIds` is array, but task can only belong to one stream
- Past dates are allowed without error (intentional for retrospective logging)
- Empty `text` is rejected by API (400 error)

## Validation Rules

- `text`: Min 1 character, max 500 characters
- `timeEstimate`: Positive integer, max 1440 minutes (24 hours)
- `dueDate`: ISO 8601 format with timezone
- `snoozeUntil`: ISO 8601 format with timezone
- `streamIds`: Array of valid stream IDs (optional)
