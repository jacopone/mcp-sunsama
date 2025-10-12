# Sunsama API Coverage Matrix

**Last Updated**: 2025-10-12
**Target Coverage**: 90% of Sunsama web UI features

## Overview

This document tracks the implementation status of Sunsama API endpoints and their corresponding web UI features. The goal is to achieve 90%+ coverage of task management features available in the Sunsama web application.

---

## Coverage Summary

| Category | Discovered | Implemented | Partial | Experimental | Coverage % |
|----------|-----------|-------------|---------|--------------|------------|
| **Task Management** | 12 | 0 | 0 | 0 | 0% |
| **User & Metadata** | 2 | 0 | 0 | 0 | 0% |
| **Organization** | 2 | 0 | 0 | 0 | 0% |
| **TOTAL** | 16 | 0 | 0 | 0 | **0%** |

**Target**: 90% (14+ endpoints fully implemented)

---

## Task Management Endpoints

### GET /api/v1/tasks (by day)
- **Status**: ⏳ Not Implemented
- **Priority**: P1 (Critical)
- **Web UI Feature**: Daily task list view
- **Functional Requirements**: FR-001
- **Parameters**:
  - `date` (required): YYYY-MM-DD format
  - `completed` (optional): Filter by completion status
- **Response**: Array of tasks for the specified date
- **Implementation Notes**: Foundation for daily planning workflow
- **Test Status**: Not Tested
- **Last Tested**: N/A

### GET /api/v1/tasks/backlog
- **Status**: ⏳ Not Implemented
- **Priority**: P2
- **Web UI Feature**: Backlog view (unscheduled tasks)
- **Functional Requirements**: FR-002, FR-005
- **Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 50, max: 100)
- **Response**: Paginated array of backlog tasks
- **Implementation Notes**: Requires pagination support
- **Test Status**: Not Tested
- **Last Tested**: N/A

### GET /api/v1/tasks/archived
- **Status**: ⏳ Not Implemented
- **Priority**: P3
- **Web UI Feature**: Archived task history
- **Functional Requirements**: FR-003, FR-005
- **Parameters**:
  - `startDate` (required): YYYY-MM-DD
  - `endDate` (required): YYYY-MM-DD
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response**: Paginated array of archived tasks with date range
- **Implementation Notes**: Max 1 year date range (FR-046 validation)
- **Test Status**: Not Tested
- **Last Tested**: N/A

### GET /api/v1/tasks/:taskId
- **Status**: ⏳ Not Implemented
- **Priority**: P1
- **Web UI Feature**: Task detail view
- **Functional Requirements**: FR-004
- **Parameters**:
  - `taskId` (required): UUID
- **Response**: Single task entity
- **Implementation Notes**: Used for task detail modal
- **Test Status**: Not Tested
- **Last Tested**: N/A

### POST /api/v1/tasks
- **Status**: ⏳ Not Implemented
- **Priority**: P1 (Critical)
- **Web UI Feature**: Create task button
- **Functional Requirements**: FR-006 through FR-011
- **Request Body**:
  - `text` (required): Task title (1-500 chars)
  - `notes` (optional): Markdown notes (max 10000 chars)
  - `scheduledDate` (optional): YYYY-MM-DD
  - `dueDate` (optional): YYYY-MM-DD
  - `plannedTime` (optional): Integer minutes (0-1440)
  - `streamId` (optional): Channel UUID
- **Response**: Created task entity with system-generated fields
- **Implementation Notes**: Past date warning (FR-010), no date = backlog (FR-008)
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/complete
- **Status**: ⏳ Not Implemented
- **Priority**: P1
- **Web UI Feature**: Task completion checkbox
- **Functional Requirements**: FR-012
- **Request Body**:
  - `completedAt` (optional): Custom timestamp (defaults to now)
- **Response**: Updated task with `completed=true` and `completedAt` set
- **Implementation Notes**: Must set `completedAt` timestamp
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/scheduled-date
- **Status**: ⏳ Not Implemented
- **Priority**: P1
- **Web UI Feature**: Drag-and-drop task rescheduling
- **Functional Requirements**: FR-013, FR-014
- **Request Body**:
  - `scheduledDate` (nullable): YYYY-MM-DD or null (null moves to backlog)
- **Response**: Updated task
- **Implementation Notes**: null = move to backlog (FR-014), past date warning
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/text
- **Status**: ⏳ Not Implemented
- **Priority**: P1
- **Web UI Feature**: Inline task title editing
- **Functional Requirements**: FR-015
- **Request Body**:
  - `text` (required): New title (1-500 chars)
- **Response**: Updated task
- **Implementation Notes**: Validate length constraints
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/notes
- **Status**: ⏳ Not Implemented
- **Priority**: P3
- **Web UI Feature**: Task notes editor
- **Functional Requirements**: FR-016
- **Request Body**:
  - `notes` (required): New notes content
  - `operation` (required): "append" or "replace"
- **Response**: Updated task
- **Implementation Notes**: Intelligent merge logic (append with "\\n" or replace)
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/planned-time
- **Status**: ⏳ Not Implemented
- **Priority**: P2
- **Web UI Feature**: Time estimate input
- **Functional Requirements**: FR-017
- **Request Body**:
  - `plannedTime` (nullable): Integer minutes (0-1440) or null to clear
- **Response**: Updated task
- **Implementation Notes**: Timeboxing feature (User Story 3)
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/stream
- **Status**: ⏳ Not Implemented
- **Priority**: P3
- **Web UI Feature**: Channel/stream assignment dropdown
- **Functional Requirements**: FR-018
- **Request Body**:
  - `streamId` (nullable): Channel UUID or null
- **Response**: Updated task
- **Implementation Notes**: Validate stream exists before assigning
- **Test Status**: Not Tested
- **Last Tested**: N/A

### PATCH /api/v1/tasks/:taskId/snooze
- **Status**: ⏳ Not Implemented
- **Priority**: P2
- **Web UI Feature**: Snooze task action
- **Functional Requirements**: FR-019
- **Request Body**:
  - `snoozedUntil` (nullable): YYYY-MM-DD or null
- **Response**: Updated task
- **Implementation Notes**: Deferred task scheduling
- **Test Status**: Not Tested
- **Last Tested**: N/A

### DELETE /api/v1/tasks/:taskId
- **Status**: ⏳ Not Implemented
- **Priority**: P1
- **Web UI Feature**: Delete task button
- **Functional Requirements**: FR-020, FR-021
- **Parameters**:
  - `taskId` (required): UUID
- **Response**: Deletion confirmation with task metadata for client confirmation
- **Implementation Notes**: Permanent deletion, return metadata for confirmation dialog
- **Test Status**: Not Tested
- **Last Tested**: N/A

---

## User & Metadata Endpoints

### GET /api/v1/user
- **Status**: ⏳ Not Implemented
- **Priority**: P1 (Required for timezone)
- **Web UI Feature**: User profile/settings
- **Functional Requirements**: FR-022, FR-024
- **Parameters**: None
- **Response**: User entity with timezone, email, settings
- **Implementation Notes**: Timezone critical for all date operations
- **Test Status**: Not Tested
- **Last Tested**: N/A

---

## Organization Endpoints

### GET /api/v1/streams
- **Status**: ⏳ Not Implemented
- **Priority**: P3
- **Web UI Feature**: Channel/stream list sidebar
- **Functional Requirements**: FR-023
- **Parameters**:
  - `includeArchived` (optional): Boolean (default: false)
- **Response**: Array of channels/streams
- **Implementation Notes**: Channels = Streams (same entity, different UI terminology)
- **Test Status**: Not Tested
- **Last Tested**: N/A

---

## Legend

- ✅ **Implemented**: Fully functional, tested, documented
- ⚠️ **Partial**: Basic functionality works, missing some features
- 🧪 **Experimental**: Implemented but behavior not fully understood
- ⏳ **Not Implemented**: Discovered but not yet implemented
- ❌ **Blocked**: Cannot implement due to missing dependencies

---

## Implementation Priority

### Phase 1: Foundation (P1 - Critical) - 0/6 complete
1. GET /api/v1/user (timezone required)
2. GET /api/v1/tasks (by day)
3. GET /api/v1/tasks/:taskId
4. POST /api/v1/tasks
5. PATCH /api/v1/tasks/:taskId/complete
6. DELETE /api/v1/tasks/:taskId

### Phase 2: Core Features (P2) - 0/4 complete
1. GET /api/v1/tasks/backlog
2. PATCH /api/v1/tasks/:taskId/scheduled-date
3. PATCH /api/v1/tasks/:taskId/planned-time
4. PATCH /api/v1/tasks/:taskId/snooze

### Phase 3: Extended Features (P3) - 0/4 complete
1. GET /api/v1/tasks/archived
2. PATCH /api/v1/tasks/:taskId/notes
3. GET /api/v1/streams
4. PATCH /api/v1/tasks/:taskId/stream

---

## Notes

- **API Discovery Method**: Browser DevTools network tab inspection
- **API Base URL**: `https://api.sunsama.com` (or discovered endpoint)
- **Authentication**: Email/password or session token (stored in system keychain)
- **Caching Strategy**: 30-second TTL for read operations, bypass on writes
- **Schema Validation**: All responses validated with Zod schemas
- **Error Handling**: Exponential backoff retry (3 attempts max)

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0.0 | Initial coverage matrix created - 0% coverage |

---

**Next Review**: After Phase 2 (Foundational) implementation complete
**Maintained By**: Development team
**Related Documents**:
- `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/contracts/coverage-matrix.json`
- `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/spec.md`
