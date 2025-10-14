# Endpoint: update-task-notes

**MCP Tool**: `update-task-notes`
**Sunsama API**: `PATCH /api/v1/tasks/:taskId/notes`
**Implementation**: src/tools/task-tools.ts:376

## Description

Update task notes with HTML or markdown content. Implements intelligent merge logic where AI client decides whether to append or replace based on user intent.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | ID of task to update |
| `html` | string | No* | HTML content for notes (mutually exclusive with markdown) |
| `markdown` | string | No* | Markdown content for notes (mutually exclusive with html) |
| `limitResponsePayload` | boolean | No | Trim response size (default: true) |

**Note**: Exactly one of `html` or `markdown` must be provided (XOR validation)

## Example Request (MCP Protocol - HTML)

```json
{
  "method": "tools/call",
  "params": {
    "name": "update-task-notes",
    "arguments": {
      "taskId": "task_abc123",
      "html": "<p>Updated notes with <strong>HTML</strong> formatting</p>",
      "limitResponsePayload": true
    }
  }
}
```

## Example Request (MCP Protocol - Markdown)

```json
{
  "method": "tools/call",
  "params": {
    "name": "update-task-notes",
    "arguments": {
      "taskId": "task_abc123",
      "markdown": "Updated notes with **markdown** formatting",
      "limitResponsePayload": true
    }
  }
}
```

## Example Request (curl equivalent to Sunsama API)

```bash
curl -X PATCH "https://api.sunsama.com/api/v1/tasks/task_abc123/notes" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<p>Updated notes with <strong>HTML</strong> formatting</p>"
  }'
```

## Example Response (TSV format - limited payload)

```
id	text	notes
task_abc123	Review Q4 budget	<p>Updated notes with <strong>HTML</strong> formatting</p>
```

## Response Fields

With `limitResponsePayload=true` (default):
- `id`: Task identifier
- `text`: Task title
- `notes`: Updated notes content

With `limitResponsePayload=false` (full response):
- All task fields returned (including streamId, dueDate, etc.)

## Intelligent Merge Logic

### Design Decision (from spec.md FR-016)

**Implementation**: The MCP tool accepts `html` or `markdown` directly and sends to Sunsama API. The **AI client** (Claude, Cursor) is responsible for merge logic:

**User Intent → AI Action**:
1. "Add note: XYZ" → AI reads existing notes, appends "\n\nXYZ", sends via `update-task-notes`
2. "Update note: XYZ" → AI sends "XYZ" directly via `update-task-notes` (replaces)
3. "Replace note with: XYZ" → AI sends "XYZ" directly (replaces)

**Rationale**: Natural language interpretation belongs in AI layer, not MCP tool layer.

## Caching Behavior

- **Cache Bypass**: Always bypasses cache (write operation)
- **Invalidation**: Invalidates task cache AND day cache for task's scheduled date

## Performance

- **Typical**: 0.6-1.2s (Sunsama API PATCH latency)
- **With trimmed response**: ~30% faster (less data transfer)
- **With retry**: Up to 3s (3 attempts with exponential backoff)

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| -32602 | Invalid params | Missing taskId OR both html/markdown provided OR neither provided |
| -32603 | Internal error | Sunsama API error or network failure |
| -32001 | Not found | Task ID doesn't exist |

## Example Error Response (XOR Validation)

```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params: Exactly one of 'html' or 'markdown' must be provided"
  }
}
```

## Related Tools

- `create-task` - Create task with initial notes
- `get-task-by-id` - Retrieve task with notes
- `update-task-text` - Update task title

## Implementation Notes

### XOR Validation (src/schemas.ts:170-181)

```typescript
.refine(
  (data) => {
    const hasHtml = data.html !== undefined;
    const hasMarkdown = data.markdown !== undefined;
    return hasHtml !== hasMarkdown; // XOR: exactly one must be true
  },
  {
    message: "Exactly one of 'html' or 'markdown' must be provided",
  }
)
```

### Response Trimming

When `limitResponsePayload=true`:
- Removes verbose fields: `comments`, `attachments`, `history`
- Reduces response size by ~30-50%
- Speeds up MCP protocol transfer

## Sunsama API Quirks

- Sunsama stores notes as HTML internally (markdown converted server-side)
- Empty string `""` clears notes (null also works)
- Very long notes (>10,000 chars) may cause performance issues
- HTML is sanitized server-side (script tags removed)
- Markdown uses GitHub-flavored markdown syntax

## Validation Rules

- `taskId`: Non-empty string
- `html`: Max 10,000 characters (soft limit)
- `markdown`: Max 10,000 characters (soft limit)
- Exactly one of `html` or `markdown` must be provided (XOR)

## Use Cases

### Append Notes
```javascript
// AI client logic (example)
const existingNotes = await getTaskById(taskId);
const updatedNotes = existingNotes.notes + "\n\n" + newNote;
await updateTaskNotes(taskId, { markdown: updatedNotes });
```

### Replace Notes
```javascript
// AI client logic (example)
await updateTaskNotes(taskId, { markdown: newNote }); // Replaces entirely
```

### Clear Notes
```javascript
await updateTaskNotes(taskId, { html: "" }); // Empty string clears notes
```
