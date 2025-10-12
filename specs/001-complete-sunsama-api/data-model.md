---
status: active
created: 2025-10-12
updated: 2025-10-12
type: reference
lifecycle: persistent
---

# Data Model: Sunsama MCP Server

Comprehensive data model documentation for the Sunsama MCP server, derived from feature specification and research findings.

## Table of Contents

1. [Entity Definitions](#entity-definitions)
2. [State Transitions](#state-transitions)
3. [Validation Rules](#validation-rules)
4. [TypeScript Type Definitions](#typescript-type-definitions)
5. [API Request/Response Types](#api-requestresponse-types)
6. [Relationships and Cardinality](#relationships-and-cardinality)

---

## Entity Definitions

### Task Entity

**Purpose**: Represents a single work item in Sunsama with scheduling, time tracking, and organizational properties.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes (system) | Unique system-generated identifier (UUID format) |
| `text` | `string` | Yes | Task title/description (1-500 characters) |
| `notes` | `string` | No | Additional context and details (Markdown supported) |
| `scheduledDate` | `ISO8601 date` | No | Date task is scheduled for (YYYY-MM-DD) |
| `dueDate` | `ISO8601 date` | No | Deadline for task completion |
| `plannedTime` | `number` | No | Time estimate in minutes (0-1440) |
| `actualTime` | `number` | No | Actual time spent in minutes (tracked) |
| `completed` | `boolean` | Yes | Completion status (default: false) |
| `completedAt` | `ISO8601 datetime` | No | Timestamp of completion (set when completed=true) |
| `snoozedUntil` | `ISO8601 date` | No | Date task is deferred to (for "snooze" feature) |
| `streamId` | `string` | No | Reference to Channel/Stream entity |
| `createdAt` | `ISO8601 datetime` | Yes (system) | Creation timestamp |
| `updatedAt` | `ISO8601 datetime` | Yes (system) | Last modification timestamp |
| `archived` | `boolean` | Yes | Whether task is archived (default: false) |

**Relationships**:
- Belongs to one User (implicit via authentication)
- Optionally belongs to one Channel/Stream
- May have one parent task (subtask relationship, if supported)

**Lifecycle States**:
- `backlog`: No scheduledDate, not completed
- `scheduled`: Has scheduledDate, not completed
- `completed`: completed = true, has completedAt
- `archived`: archived = true

---

### User Entity

**Purpose**: Represents the authenticated Sunsama user with profile and settings information.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique user identifier |
| `email` | `string` | Yes | User's email address (authentication) |
| `name` | `string` | No | Display name |
| `timezone` | `string` | Yes | IANA timezone (e.g., "America/New_York") |
| `groups` | `string[]` | No | Group memberships for workspace organization |
| `workspaceId` | `string` | No | Associated workspace identifier |
| `settings` | `object` | No | User preferences and configuration |
| `createdAt` | `ISO8601 datetime` | Yes | Account creation timestamp |

**Relationships**:
- Owns many Tasks
- Owns many Channels/Streams
- Belongs to one Workspace

**Notes**:
- Timezone critical for date/time operations (FR-024)
- User entity is singleton per MCP server instance (single-user personal use)

---

### Channel/Stream Entity

**Purpose**: Organizational container for grouping tasks by project, context, or category.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique channel identifier |
| `name` | `string` | Yes | Display name (e.g., "Work", "Personal", "Finance") |
| `color` | `string` | No | Color code for visual identification (hex format) |
| `icon` | `string` | No | Icon identifier or emoji |
| `order` | `number` | No | Display order in UI |
| `archived` | `boolean` | Yes | Whether channel is archived (default: false) |
| `createdAt` | `ISO8601 datetime` | Yes | Creation timestamp |

**Relationships**:
- Belongs to one User
- Contains many Tasks

**Notes**:
- Also referred to as "Streams" in some Sunsama UI contexts
- Channels provide work/personal separation (User Story 5)

---

### Date Entity (Logical)

**Purpose**: Represents a calendar day in the user's timezone for task scheduling.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `ISO8601 date` | Yes | Calendar date in YYYY-MM-DD format |
| `timezone` | `string` | Yes | User's timezone (inherited from User entity) |

**Relationships**:
- Aggregates many Tasks (via scheduledDate field)

**Notes**:
- Date is not a persisted entity but a logical grouping concept
- All date operations respect user timezone (FR-024)
- Past dates allowed for task creation with warning (FR-010)

---

### Time Estimate (Value Object)

**Purpose**: Represents planned or actual time duration for a task.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `minutes` | `number` | Yes | Duration in minutes (0-1440 max, 24 hours) |

**Notes**:
- Stored as integer minutes in Task entity
- UI may display as hours/minutes (e.g., "2h 30m")
- Used for timeboxing and capacity planning (User Story 3)

---

### Backlog (Logical Collection)

**Purpose**: Virtual collection of unscheduled tasks awaiting future planning.

**Query Definition**:
```typescript
tasks.filter(task =>
  task.scheduledDate === null &&
  task.completed === false &&
  task.archived === false
)
```

**Relationships**:
- Contains many Tasks (via filter condition)

**Notes**:
- Not a separate entity, but a filtered view of Tasks
- Moving task to backlog = setting scheduledDate to null (FR-014)

---

### Archive (Logical Collection)

**Purpose**: Historical collection of completed or past tasks.

**Query Definition**:
```typescript
tasks.filter(task =>
  task.archived === true ||
  (task.completed === true && isOlderThan(task.completedAt, threshold))
)
```

**Relationships**:
- Contains many Tasks (via filter condition)

**Notes**:
- Tasks may be explicitly archived or auto-archived based on completion date
- Archived tasks accessible via date range queries (FR-003)

---

## State Transitions

### Task Lifecycle States

```
┌─────────────────────────────────────────────────────────────┐
│                         Task States                         │
└─────────────────────────────────────────────────────────────┘

     CREATE TASK
          ↓
    ┌──────────┐
    │ BACKLOG  │ ← (scheduledDate = null, completed = false)
    └──────────┘
          │
          │ SCHEDULE: Set scheduledDate
          ↓
    ┌──────────┐
    │SCHEDULED │ ← (scheduledDate != null, completed = false)
    └──────────┘
          │
          │ COMPLETE: Set completed=true, completedAt=now()
          ↓
    ┌──────────┐
    │COMPLETED │ ← (completed = true, completedAt set)
    └──────────┘
          │
          │ ARCHIVE: Set archived=true (manual or automatic)
          ↓
    ┌──────────┐
    │ ARCHIVED │ ← (archived = true)
    └──────────┘
```

### Valid State Transitions

| From State | To State | Trigger | Validation |
|------------|----------|---------|------------|
| **New** | Backlog | Create task without date | Title required (FR-006) |
| **New** | Scheduled | Create task with date | Title required, date format valid |
| **Backlog** | Scheduled | Set scheduledDate | Date format valid, not null |
| **Backlog** | Completed | Mark complete | completedAt = current timestamp |
| **Scheduled** | Backlog | Clear scheduledDate (FR-014) | Set scheduledDate = null |
| **Scheduled** | Scheduled | Reschedule (FR-013) | New date format valid |
| **Scheduled** | Completed | Mark complete (FR-012) | completedAt = current timestamp |
| **Completed** | Archived | Archive task | archived = true |
| **Completed** | Scheduled | Reopen task | Set completed = false, clear completedAt |
| **Any** | Deleted | Delete task (FR-020) | Permanent deletion, no undo |

### State Transition Conditions

**Backlog → Scheduled**:
```typescript
conditions: {
  scheduledDate: string (YYYY-MM-DD format)
  // Past dates allowed with warning (FR-010)
}

effects: {
  task.scheduledDate = scheduledDate
  task.updatedAt = now()
}
```

**Scheduled → Completed**:
```typescript
conditions: {
  completed: true
}

effects: {
  task.completed = true
  task.completedAt = now()
  task.updatedAt = now()
}
```

**Scheduled → Backlog**:
```typescript
conditions: {
  moveToBacklog: true
}

effects: {
  task.scheduledDate = null
  task.updatedAt = now()
}
```

**Any → Archived**:
```typescript
conditions: {
  archived: true OR
  (completed === true AND daysSince(completedAt) > threshold)
}

effects: {
  task.archived = true
  task.updatedAt = now()
}
```

### Snooze State (Special Case)

Snoozed tasks remain in "Scheduled" state but with future date:

```typescript
conditions: {
  snoozedUntil: string (future date)
}

effects: {
  task.snoozedUntil = futureDate
  task.scheduledDate = futureDate (or null if moved to backlog)
  task.updatedAt = now()
}

behavior: {
  // Task appears in future date's task list
  // Does not appear in current date until snoozeUntil is reached
}
```

---

## Validation Rules

### Task Validation Rules

**FR-006: Task Title Required**
```typescript
validation: {
  field: "text"
  rule: "required"
  minLength: 1
  maxLength: 500
  errorMessage: "Task title is required and must be 1-500 characters"
}
```

**FR-010: Past Date Tasks Allowed with Warning**
```typescript
validation: {
  field: "scheduledDate"
  rule: "custom"
  condition: isPastDate(scheduledDate)
  action: "warn"
  warningMessage: "Creating task for past date: {scheduledDate}"
  allowProceed: true
}

function isPastDate(date: string): boolean {
  const taskDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate < today;
}
```

**FR-016: Intelligent Note Merge**
```typescript
validation: {
  field: "notes"
  rule: "custom"
  behavior: "conditional-merge"
}

function updateNotes(
  existingNotes: string | null,
  newNotes: string,
  intent: "add" | "update" | "replace"
): string {
  if (intent === "add" || intent === "update" && existingNotes) {
    // Append with newline separator
    return existingNotes ? `${existingNotes}\n${newNotes}` : newNotes;
  } else {
    // Replace entirely
    return newNotes;
  }
}

// Intent detection from user command:
// "add note" → intent = "add" (append)
// "update note" → intent = "update" (replace)
// "change note" → intent = "replace" (replace)
```

**FR-024: Timezone Handling**
```typescript
validation: {
  field: "scheduledDate"
  rule: "timezone-aware"
}

function parseDate(dateString: string, userTimezone: string): Date {
  // Parse date in user's timezone, not server timezone
  const zonedDate = DateTime.fromISO(dateString, { zone: userTimezone });
  return zonedDate.toJSDate();
}

function formatDate(date: Date, userTimezone: string): string {
  // Format date for user's timezone
  return DateTime.fromJSDate(date, { zone: userTimezone })
    .toISODate(); // YYYY-MM-DD
}
```

**Time Estimate Limits**
```typescript
validation: {
  field: "plannedTime"
  rule: "range"
  min: 0
  max: 1440  // 24 hours max
  errorMessage: "Time estimate must be between 0 and 1440 minutes (24 hours)"
}
```

**Date Format Validation**
```typescript
validation: {
  field: "scheduledDate" | "dueDate" | "snoozedUntil"
  rule: "iso8601-date"
  format: "YYYY-MM-DD"
  errorMessage: "Date must be in YYYY-MM-DD format"
}

function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}
```

**Field Length Limits**
```typescript
fieldLimits: {
  text: { min: 1, max: 500 },
  notes: { min: 0, max: 10000 },  // Arbitrary large limit
  streamId: { format: "uuid" },
  id: { format: "uuid" }
}
```

### User Validation Rules

**Email Format**
```typescript
validation: {
  field: "email"
  rule: "email-format"
  errorMessage: "Invalid email address format"
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Timezone Validation**
```typescript
validation: {
  field: "timezone"
  rule: "iana-timezone"
  errorMessage: "Invalid IANA timezone identifier"
}

function validateTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

### Channel Validation Rules

**Name Required**
```typescript
validation: {
  field: "name"
  rule: "required"
  minLength: 1
  maxLength: 100
  errorMessage: "Channel name is required (1-100 characters)"
}
```

---

## TypeScript Type Definitions

### Core Entity Schemas (Zod)

```typescript
import { z } from 'zod';

/**
 * Task Entity Schema
 *
 * Represents a work item with scheduling, completion tracking,
 * and organizational properties.
 */
export const TaskSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
  text: z.string()
    .min(1, 'Task text required')
    .max(500, 'Task text too long (max 500 characters)'),
  notes: z.string()
    .max(10000, 'Notes too long (max 10000 characters)')
    .optional()
    .nullable(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  plannedTime: z.number()
    .int('Planned time must be integer minutes')
    .min(0, 'Planned time cannot be negative')
    .max(1440, 'Planned time cannot exceed 24 hours')
    .optional()
    .nullable(),
  actualTime: z.number()
    .int('Actual time must be integer minutes')
    .min(0, 'Actual time cannot be negative')
    .optional()
    .nullable(),
  completed: z.boolean().default(false),
  completedAt: z.string()
    .datetime('Invalid datetime format')
    .optional()
    .nullable(),
  snoozedUntil: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  streamId: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archived: z.boolean().default(false),
}).refine(
  (data) => {
    // If completed, completedAt must be set
    if (data.completed && !data.completedAt) {
      return false;
    }
    return true;
  },
  { message: 'Completed tasks must have completedAt timestamp' }
).refine(
  (data) => {
    // Due date must be >= scheduled date if both present
    if (data.scheduledDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.scheduledDate);
    }
    return true;
  },
  { message: 'Due date must be on or after scheduled date' }
);

export type Task = z.infer<typeof TaskSchema>;

/**
 * User Entity Schema
 *
 * Represents authenticated Sunsama user with profile and settings.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email format'),
  name: z.string().optional().nullable(),
  timezone: z.string().refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid IANA timezone' }
  ),
  groups: z.array(z.string()).optional().default([]),
  workspaceId: z.string().optional().nullable(),
  settings: z.record(z.unknown()).optional().default({}),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Channel/Stream Entity Schema
 *
 * Organizational container for grouping tasks by project or context.
 */
export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(1, 'Channel name required')
    .max(100, 'Channel name too long (max 100 characters)'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format (#RRGGBB)')
    .optional()
    .nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().int().min(0).optional().default(0),
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type Channel = z.infer<typeof ChannelSchema>;

/**
 * Time Estimate Value Object
 */
export const TimeEstimateSchema = z.object({
  minutes: z.number()
    .int('Minutes must be integer')
    .min(0, 'Minutes cannot be negative')
    .max(1440, 'Cannot exceed 24 hours (1440 minutes)'),
});

export type TimeEstimate = z.infer<typeof TimeEstimateSchema>;
```

### Partial Update Schemas

```typescript
/**
 * Partial Task Update Schema
 *
 * Allows updating subset of task fields without requiring all fields.
 */
export const TaskUpdateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  notes: z.string().max(10000).optional(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  plannedTime: z.number()
    .int()
    .min(0)
    .max(1440)
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  snoozedUntil: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  streamId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
```

---

## API Request/Response Types

### Task Operations

**Create Task**
```typescript
/**
 * Request: Create new task
 *
 * Endpoint: POST /api/v1/tasks
 */
export const CreateTaskRequestSchema = z.object({
  text: z.string().min(1).max(500),
  notes: z.string().max(10000).optional(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  plannedTime: z.number().int().min(0).max(1440).optional(),
  streamId: z.string().uuid().optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

/**
 * Response: Created task with system-generated fields
 */
export const CreateTaskResponseSchema = TaskSchema;

export type CreateTaskResponse = z.infer<typeof CreateTaskResponseSchema>;
```

**Get Tasks by Day**
```typescript
/**
 * Request: Retrieve tasks for specific date
 *
 * Endpoint: GET /api/v1/tasks?date={date}&completed={boolean}
 */
export const GetTasksByDayRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.enum(['true', 'false', 'all']).optional().default('all'),
});

export type GetTasksByDayRequest = z.infer<typeof GetTasksByDayRequestSchema>;

/**
 * Response: Array of tasks for the date
 */
export const GetTasksByDayResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  date: z.string(),
  totalCount: z.number().int().min(0),
});

export type GetTasksByDayResponse = z.infer<typeof GetTasksByDayResponseSchema>;
```

**Update Task**
```typescript
/**
 * Request: Update existing task
 *
 * Endpoint: PATCH /api/v1/tasks/{taskId}
 */
export const UpdateTaskRequestSchema = z.object({
  taskId: z.string().uuid(),
  updates: TaskUpdateSchema,
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

/**
 * Response: Updated task entity
 */
export const UpdateTaskResponseSchema = TaskSchema;

export type UpdateTaskResponse = z.infer<typeof UpdateTaskResponseSchema>;
```

**Mark Task Complete**
```typescript
/**
 * Request: Mark task as completed
 *
 * Endpoint: PATCH /api/v1/tasks/{taskId}/complete
 */
export const CompleteTaskRequestSchema = z.object({
  taskId: z.string().uuid(),
  completedAt: z.string()
    .datetime()
    .optional()
    .describe('Custom completion timestamp (defaults to now)'),
});

export type CompleteTaskRequest = z.infer<typeof CompleteTaskRequestSchema>;

/**
 * Response: Updated task with completed=true and completedAt set
 */
export const CompleteTaskResponseSchema = TaskSchema;

export type CompleteTaskResponse = z.infer<typeof CompleteTaskResponseSchema>;
```

**Delete Task**
```typescript
/**
 * Request: Permanently delete task
 *
 * Endpoint: DELETE /api/v1/tasks/{taskId}
 */
export const DeleteTaskRequestSchema = z.object({
  taskId: z.string().uuid(),
});

export type DeleteTaskRequest = z.infer<typeof DeleteTaskRequestSchema>;

/**
 * Response: Deletion confirmation with metadata
 */
export const DeleteTaskResponseSchema = z.object({
  success: z.boolean(),
  deletedTask: z.object({
    id: z.string().uuid(),
    text: z.string(),
    scheduledDate: z.string().nullable(),
    notesPreview: z.string().optional(),
  }),
  deletedAt: z.string().datetime(),
});

export type DeleteTaskResponse = z.infer<typeof DeleteTaskResponseSchema>;
```

**Get Backlog Tasks**
```typescript
/**
 * Request: Retrieve backlog (unscheduled) tasks
 *
 * Endpoint: GET /api/v1/tasks/backlog?page={number}&limit={number}
 */
export const GetBacklogRequestSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export type GetBacklogRequest = z.infer<typeof GetBacklogRequestSchema>;

/**
 * Response: Paginated backlog tasks
 */
export const GetBacklogResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    totalCount: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetBacklogResponse = z.infer<typeof GetBacklogResponseSchema>;
```

**Get Archived Tasks**
```typescript
/**
 * Request: Retrieve archived tasks with date range filtering
 *
 * Endpoint: GET /api/v1/tasks/archived?startDate={date}&endDate={date}
 */
export const GetArchivedRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export type GetArchivedRequest = z.infer<typeof GetArchivedRequestSchema>;

/**
 * Response: Paginated archived tasks
 */
export const GetArchivedResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    totalCount: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetArchivedResponse = z.infer<typeof GetArchivedResponseSchema>;
```

### User Operations

**Get User Profile**
```typescript
/**
 * Request: Retrieve authenticated user's profile
 *
 * Endpoint: GET /api/v1/user
 */
export const GetUserRequestSchema = z.object({});

export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;

/**
 * Response: User profile with timezone and settings
 */
export const GetUserResponseSchema = UserSchema;

export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
```

### Channel Operations

**Get Channels/Streams**
```typescript
/**
 * Request: Retrieve all channels for user
 *
 * Endpoint: GET /api/v1/streams
 */
export const GetChannelsRequestSchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

export type GetChannelsRequest = z.infer<typeof GetChannelsRequestSchema>;

/**
 * Response: Array of channels
 */
export const GetChannelsResponseSchema = z.object({
  channels: z.array(ChannelSchema),
  totalCount: z.number().int(),
});

export type GetChannelsResponse = z.infer<typeof GetChannelsResponseSchema>;
```

---

## Relationships and Cardinality

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Entity Relationships                 │
└─────────────────────────────────────────────────────────┘

                       ┌──────────┐
                       │   User   │
                       │  (1)     │
                       └────┬─────┘
                            │
                            │ owns (1:N)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ↓             ↓             ↓
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   Task   │  │ Channel  │  │ Timezone │
        │  (N)     │  │  (N)     │  │  (1)     │
        └────┬─────┘  └────┬─────┘  └──────────┘
             │             │
             │ belongs to  │
             │   (N:1)     │
             └─────────────┘

        Task Aggregations (Logical Views):
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Backlog  │  │  Daily   │  │ Archive  │
        │  View    │  │  View    │  │  View    │
        └──────────┘  └──────────┘  └──────────┘
```

### Cardinality Details

**User → Task**
- Relationship: One-to-Many
- User has many Tasks (0..*)
- Task belongs to one User (1)
- Cascade delete: Deleting user deletes all tasks (implementation dependent)

**User → Channel**
- Relationship: One-to-Many
- User has many Channels (0..*)
- Channel belongs to one User (1)
- Cascade delete: Deleting user deletes all channels

**Channel → Task**
- Relationship: One-to-Many (optional)
- Channel has many Tasks (0..*)
- Task optionally belongs to one Channel (0..1)
- Null handling: Task.streamId can be null (no channel assignment)
- Cascade delete: Deleting channel sets Task.streamId to null

**User → Timezone**
- Relationship: One-to-One
- User has one Timezone (1)
- Timezone setting is required for user

**Date → Task (Logical)**
- Relationship: One-to-Many (aggregation)
- Date aggregates many Tasks via scheduledDate (0..*)
- Task can have one scheduledDate (0..1)
- Not a foreign key relationship, but a grouping/filter condition

### Query Patterns

**Get all tasks for user and date**
```typescript
query: {
  where: {
    userId: authenticatedUserId,
    scheduledDate: targetDate,
  },
  orderBy: {
    createdAt: 'asc',
  }
}
```

**Get backlog for user**
```typescript
query: {
  where: {
    userId: authenticatedUserId,
    scheduledDate: null,
    completed: false,
    archived: false,
  },
  orderBy: {
    createdAt: 'desc',
  }
}
```

**Get tasks by channel**
```typescript
query: {
  where: {
    userId: authenticatedUserId,
    streamId: channelId,
  },
  orderBy: {
    scheduledDate: 'asc',
    createdAt: 'asc',
  }
}
```

---

## Notes and Implementation Guidance

### Timezone Handling

All date/time operations must respect user's timezone (FR-024):

```typescript
import { DateTime } from 'luxon';

function convertToUserTimezone(isoDate: string, userTimezone: string): DateTime {
  return DateTime.fromISO(isoDate, { zone: userTimezone });
}

function formatDateForUser(date: Date, userTimezone: string): string {
  return DateTime.fromJSDate(date, { zone: userTimezone }).toISODate();
}

function getCurrentDateForUser(userTimezone: string): string {
  return DateTime.now().setZone(userTimezone).toISODate();
}
```

### Cache Keys

For caching strategy (30-second TTL per spec):

```typescript
cacheKeys: {
  task: (taskId: string) => `task:${taskId}`,
  dayTasks: (date: string) => `day:${date}`,
  backlog: () => 'backlog',
  archived: (startDate: string, endDate: string) => `archived:${startDate}:${endDate}`,
  user: () => 'user',
  channels: () => 'channels',
}
```

### API Endpoint Coverage Tracking

Track which Sunsama API endpoints are implemented:

| Feature | Endpoint | Status | FR Reference |
|---------|----------|--------|--------------|
| Create task | `POST /api/v1/tasks` | ✅ Implemented | FR-006 |
| Get tasks by day | `GET /api/v1/tasks?date={date}` | ✅ Implemented | FR-001 |
| Get backlog | `GET /api/v1/tasks/backlog` | ✅ Implemented | FR-002 |
| Get archived | `GET /api/v1/tasks/archived` | ✅ Implemented | FR-003 |
| Get task by ID | `GET /api/v1/tasks/{id}` | ✅ Implemented | FR-004 |
| Update task | `PATCH /api/v1/tasks/{id}` | ✅ Implemented | FR-012-FR-019 |
| Delete task | `DELETE /api/v1/tasks/{id}` | ✅ Implemented | FR-020-FR-021 |
| Get user | `GET /api/v1/user` | ✅ Implemented | FR-022 |
| Get channels | `GET /api/v1/streams` | ✅ Implemented | FR-023 |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0 | Initial data model documentation |

---

**Document Status**: Active
**Maintained By**: Project team
**Next Review**: After implementation phase
**Related Documents**:
- `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/spec.md`
- `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/research.md`
