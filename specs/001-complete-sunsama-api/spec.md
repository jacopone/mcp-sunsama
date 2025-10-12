# Feature Specification: Complete Sunsama API Coverage

**Feature Branch**: `001-complete-sunsama-api`
**Created**: 2025-10-12
**Status**: Draft
**Input**: Complete Sunsama API coverage for personal MCP server extending robertn702 implementation

## User Scenarios & Testing

### User Story 1 - Daily Planning Workflow (Priority: P1)

As a Sunsama user, I want AI assistants to help me plan my day by accessing and managing my tasks, so that I can use natural language to organize my work without switching to the Sunsama web app.

**Why this priority**: Daily planning is the core Sunsama workflow. Without this, the MCP server provides no meaningful value.

**Independent Test**: Can be fully tested by asking an AI assistant to "show me today's tasks" and "create a task for tomorrow" and verifying the operations succeed and match the Sunsama web UI.

**Acceptance Scenarios**:

1. **Given** I have tasks scheduled for today, **When** I ask my AI assistant "what's on my schedule today?", **Then** the assistant retrieves and displays all my tasks with their properties (title, time estimate, due date, completion status)

2. **Given** I want to create a new task, **When** I tell my AI assistant "create a task to review Q4 budget tomorrow at 2pm with 1 hour time estimate", **Then** a new task is created in Sunsama with the correct date, time, and duration

3. **Given** I have completed a task, **When** I tell my AI assistant "mark the budget review task as complete", **Then** the task is marked complete in Sunsama with the current timestamp

4. **Given** I want to reschedule a task, **When** I tell my AI assistant "move the budget review to Friday", **Then** the task's scheduled date is updated in Sunsama

---

### User Story 2 - Backlog and Future Task Management (Priority: P2)

As a Sunsama user, I want AI assistants to help me manage my backlog and future tasks, so that I can capture ideas and review upcoming work without leaving my AI coding environment.

**Why this priority**: Backlog management is essential for long-term planning but less urgent than daily task operations.

**Independent Test**: Can be tested independently by asking the AI to "show my backlog" and "add a task to my backlog" without requiring daily planning features.

**Acceptance Scenarios**:

1. **Given** I have tasks in my backlog, **When** I ask my AI assistant "show me my backlog", **Then** all backlog tasks are retrieved and displayed

2. **Given** I want to capture a new idea, **When** I tell my AI assistant "add to backlog: research new project management tools", **Then** a new task is created in my Sunsama backlog

3. **Given** I want to schedule a backlog task, **When** I tell my AI assistant "schedule the research task for next Tuesday", **Then** the task moves from backlog to the specified date

4. **Given** I want to review future work, **When** I ask "what's on my schedule next week?", **Then** all tasks scheduled for next week are retrieved

---

### User Story 3 - Task Timeboxing and Focus Mode (Priority: P2)

As a Sunsama user, I want AI assistants to help me manage task time estimates and work sessions, so that I can track how long work actually takes versus my estimates.

**Why this priority**: Timeboxing is a key Sunsama differentiator, but can function independently of other features.

**Independent Test**: Can be tested by creating a task with a time estimate and verifying the estimate is stored and retrievable.

**Acceptance Scenarios**:

1. **Given** I'm creating a new task, **When** I specify "with 2 hour time estimate", **Then** the task is created with a 2-hour planned time property

2. **Given** I have a task with a time estimate, **When** I ask "how long did I plan for the budget review?", **Then** the assistant retrieves and displays the planned time estimate

3. **Given** I want to adjust estimates, **When** I say "change the budget review estimate to 90 minutes", **Then** the task's planned time is updated to 90 minutes

---

### User Story 4 - Task Notes and Context Management (Priority: P3)

As a Sunsama user, I want AI assistants to read and update task notes, so that I can keep all task context accessible without switching applications.

**Why this priority**: Notes provide valuable context but are not blocking for basic task management workflows.

**Independent Test**: Can be tested by creating a task with notes and verifying notes are stored and retrievable independently of other task properties.

**Acceptance Scenarios**:

1. **Given** I'm creating a task, **When** I specify notes like "Need to review expenses from last quarter and compare with projections", **Then** the notes are attached to the task

2. **Given** A task has notes, **When** I ask "what are the notes for the budget review task?", **Then** the assistant retrieves and displays the task notes

3. **Given** I want to add context, **When** I say "add a note to budget review: check with finance team first", **Then** the new note is appended to existing notes with a newline separator

4. **Given** A task has existing notes, **When** I say "update the note for budget review: consolidated review completed", **Then** the existing notes are replaced entirely with the new text

---

### User Story 5 - Channel/Stream Organization (Priority: P3)

As a Sunsama user, I want AI assistants to organize tasks by channel/stream, so that I can keep work and personal tasks separate through natural language commands.

**Why this priority**: Organization is important for multi-project users but not essential for single-context usage.

**Independent Test**: Can be tested by retrieving available channels and assigning a task to a specific channel.

**Acceptance Scenarios**:

1. **Given** I have multiple channels configured, **When** I ask "what channels do I have?", **Then** all my Sunsama channels/streams are listed

2. **Given** I'm creating a task, **When** I specify "in my Work channel", **Then** the task is assigned to the Work channel

3. **Given** I want to reorganize, **When** I say "move the budget review to my Finance channel", **Then** the task's channel assignment is updated

---

### User Story 6 - Archived Task History (Priority: P3)

As a Sunsama user, I want AI assistants to help me review completed and archived tasks, so that I can reflect on past work and track accomplishments.

**Why this priority**: Historical review is valuable for reflection but not needed for active daily workflows.

**Independent Test**: Can be tested by retrieving archived tasks from a specific date range and verifying completed tasks are accessible.

**Acceptance Scenarios**:

1. **Given** I have completed tasks from last week, **When** I ask "what did I complete last week?", **Then** all completed tasks from that date range are retrieved

2. **Given** I want to review past work, **When** I ask "show archived tasks from September", **Then** archived tasks from September are displayed

3. **Given** I need task details, **When** I reference an archived task by name, **Then** the assistant can retrieve full details including notes and time tracking

---

### Edge Cases

- What happens when a task is scheduled for a date that already has the maximum recommended tasks (Sunsama's daily task limit)?
- **Recurring tasks**: Out of scope for MVP - explicitly excluded, to be added in future roadmap
- **Past date tasks**: System allows task creation on past dates with warning message "creating task for past date" to support retrospective logging
- How does the system handle timezone differences between the user's local time and Sunsama's stored timezone?
- What happens when network connectivity is lost mid-operation?
- How does the system handle Sunsama API changes or endpoint deprecations?
- What happens when task properties exceed Sunsama's field length limits (e.g., very long task titles or notes)?

## Clarifications

### Session 2025-10-12

- Q: When cached task data becomes stale (user edits tasks in Sunsama web app while MCP server has cached data), how should the cache be invalidated? → A: Aggressive: Cache expires after 30 seconds, always fetch fresh on critical operations (create/update/delete)
- Q: When a user asks to "add a note" to an existing task, should the system append to existing notes or replace them? → A: Intelligent merge: Append if user says "add note", replace if user says "update note" or "change note"
- Q: What happens when trying to create a task with a date in the past? → A: Allow with warning: Create task on past date but warn user "creating task for past date"
- Q: How does the system handle tasks with recurring schedules if Sunsama supports recurring tasks? → A: Document as out-of-scope: Explicitly exclude recurring tasks from MVP, add to future roadmap
- Q: How should deletion confirmation work in the MCP protocol context? → A: MCP client handles confirmation: Server provides deletion metadata, client app shows confirmation dialog

## Requirements

### Functional Requirements

**Task Reading Operations**:

- **FR-001**: System MUST retrieve all tasks for a specified date with completion status filtering
- **FR-002**: System MUST retrieve all tasks from the user's backlog
- **FR-003**: System MUST retrieve archived tasks with date range filtering
- **FR-004**: System MUST retrieve individual task details by task identifier
- **FR-005**: System MUST support pagination for large task lists (backlog, archived tasks)

**Task Creation Operations**:

- **FR-006**: System MUST create new tasks with title (required)
- **FR-007**: System MUST support optional task properties: notes, time estimate, due date, scheduled date, channel/stream assignment
- **FR-008**: System MUST create tasks in backlog when no date specified
- **FR-009**: System MUST create tasks on specified future or current dates
- **FR-010**: System MUST allow task creation on past dates and display warning message "creating task for past date"
- **FR-011**: System MUST assign system-generated unique identifiers to new tasks

**Task Update Operations**:

- **FR-012**: System MUST mark tasks as complete with completion timestamp
- **FR-013**: System MUST update task scheduled dates (reschedule to different day)
- **FR-014**: System MUST move tasks from scheduled dates back to backlog
- **FR-015**: System MUST update task text/title
- **FR-016**: System MUST update task notes with intelligent merge: append notes (with newline separator) when user says "add note", replace notes completely when user says "update note" or "change note"
- **FR-017**: System MUST update task time estimates
- **FR-018**: System MUST update task channel/stream assignments
- **FR-019**: System MUST update task snooze dates for deferred tasks

**Task Deletion Operations**:

- **FR-020**: System MUST permanently delete tasks by identifier
- **FR-021**: System MUST provide task metadata (title, date, notes preview) in deletion tool schema to enable MCP client confirmation dialogs

**User and Metadata Operations**:

- **FR-022**: System MUST retrieve user profile information including timezone
- **FR-023**: System MUST retrieve available channels/streams for task organization
- **FR-024**: System MUST respect user's timezone for all date/time operations

**API Coverage Tracking**:

- **FR-025**: System MUST document which Sunsama web UI features are fully supported
- **FR-026**: System MUST document which features are partially supported with limitations
- **FR-027**: System MUST document discovered but unimplemented endpoints in a coverage matrix
- **FR-028**: System MUST mark features as "experimental" when endpoint behavior is incompletely understood

**Error Handling and Resilience**:

- **FR-029**: System MUST gracefully handle network timeouts with retry logic (exponential backoff, max 3 attempts)
- **FR-030**: System MUST provide actionable error messages when operations fail
- **FR-031**: System MUST detect and report API schema changes (version mismatch errors)
- **FR-032**: System MUST log sufficient debugging information for troubleshooting API changes
- **FR-033**: System MUST cache successfully retrieved data with 30-second expiration to reduce API calls
- **FR-034**: System MUST bypass cache and fetch fresh data for all task creation, update, and deletion operations
- **FR-035**: System MUST validate all API responses against expected schemas before returning data

**Authentication and Security**:

- **FR-036**: System MUST authenticate using email and password credentials
- **FR-037**: System MUST support session token authentication for persistent sessions
- **FR-038**: System MUST securely store credentials (system keychain, never plaintext)
- **FR-039**: System MUST use HTTPS exclusively for all API communication
- **FR-040**: System MUST rotate session tokens following Sunsama's authentication patterns
- **FR-041**: System MUST never log credentials or session tokens, even in debug mode

### Key Entities

- **Task**: Represents a single work item with properties: title, notes, scheduled date, due date, time estimate, completion status, completion timestamp, channel/stream assignment, snooze date, unique identifier
- **User**: Represents the authenticated Sunsama user with properties: user ID, email, timezone, group memberships, profile information
- **Channel/Stream**: Represents a project or category for organizing tasks with properties: name, identifier, color/icon (if available)
- **Date**: Represents a calendar day for scheduling tasks, respecting user timezone
- **Time Estimate**: Represents planned duration for a task in minutes or hours
- **Backlog**: Special collection of unscheduled tasks awaiting future planning
- **Archive**: Historical collection of completed or past tasks with date range access

## Success Criteria

### Measurable Outcomes

**API Coverage**:

- **SC-001**: System exposes at least 90% of Sunsama web UI task management features through MCP tools
- **SC-002**: Coverage matrix documents all discovered Sunsama API endpoints with implementation status

**Performance**:

- **SC-003**: Task retrieval operations complete in under 2 seconds for cached data
- **SC-004**: Task retrieval operations complete in under 5 seconds for fresh API calls
- **SC-005**: Task creation and update operations complete in under 3 seconds
- **SC-006**: System startup time is under 3 seconds

**Reliability**:

- **SC-007**: System successfully recovers from transient network errors in 95% of cases through retry logic
- **SC-008**: System provides actionable error messages for 100% of API failures
- **SC-009**: System detects API schema changes and reports version mismatches before crashing

**User Experience**:

- **SC-010**: Users can complete common task operations (create, read, update, complete) through natural language AI commands without switching to Sunsama web app
- **SC-011**: Task data returned by MCP server matches Sunsama web UI data exactly (verified through manual testing)
- **SC-012**: Users can plan an entire day's work through AI assistant interactions in under 5 minutes

**Security**:

- **SC-013**: Credentials are stored in system keychain, never in plaintext configuration files
- **SC-014**: All API communication uses HTTPS with certificate validation
- **SC-015**: Zero credential leaks in logs or error messages during normal and error conditions

## Assumptions

1. **Base Implementation**: Assumes robertn702/mcp-sunsama provides working foundation for authentication, basic task CRUD, and MCP protocol compliance
2. **API Stability**: Assumes Sunsama's undocumented API changes no more frequently than monthly (major changes)
3. **Single User**: Assumes single Sunsama account usage (no multi-tenant scenarios)
4. **Network Availability**: Assumes reasonably reliable internet connection (occasional transient failures acceptable)
5. **Sunsama Subscription**: Assumes active Sunsama subscription with full feature access
6. **Development Environment**: Assumes development on Linux/macOS with Node.js 18+ and TypeScript support
7. **API Discovery Method**: Assumes browser DevTools network inspection provides accurate endpoint information
8. **Testing Account**: Assumes availability of dedicated Sunsama workspace for integration testing
9. **MCP Client**: Assumes testing with Claude Desktop and/or Cursor as primary MCP clients
10. **Feature Completeness**: Assumes robertn702's implementation covers approximately 60-70% of basic task operations based on repository analysis

## Dependencies

1. **External Dependencies**:
   - robertn702/mcp-sunsama repository as base implementation
   - robertn702/sunsama-api TypeScript wrapper library
   - Active Sunsama user account with valid credentials
   - Node.js runtime environment (v18 or higher)
   - MCP client software (Claude Desktop, Cursor, or compatible)

2. **Development Dependencies**:
   - TypeScript compiler and type definitions
   - Zod library for schema validation
   - Testing framework for integration tests
   - Browser DevTools for API endpoint discovery
   - System keychain access for credential storage

3. **Documentation Dependencies**:
   - Sunsama web application as reference for feature discovery
   - MCP protocol specification for compliance validation
   - robertn702 repository documentation for understanding existing architecture

## Constraints

1. **Technical Constraints**:
   - Must use TypeScript and Node.js to maintain compatibility with robertn702's codebase
   - Must comply with Model Context Protocol specification for all tools and resources
   - Must work within limitations of Sunsama's undocumented API (no official support)
   - Cannot guarantee stability across Sunsama product updates

2. **Scope Constraints**:
   - Personal use only (not designed for multi-user or commercial deployment)
   - Focus on task management features (may exclude some peripheral Sunsama features like analytics dashboards)
   - No official Sunsama partnership or endorsement

3. **Performance Constraints**:
   - Tool response time limited by Sunsama API response times (outside our control)
   - Caching effectiveness limited by cache staleness vs. data freshness tradeoff
   - Network latency impacts all operations

4. **Security Constraints**:
   - Credentials must never be stored in plaintext (system keychain required)
   - All API communication must use HTTPS
   - Cannot implement custom authentication schemes (must use Sunsama's existing auth)

5. **Maintenance Constraints**:
   - Requires ongoing monitoring of Sunsama product changes
   - API breakage may require rapid debugging and fixes
   - No guaranteed support timeline for fixing breaks caused by Sunsama updates

## Out of Scope

The following features are explicitly excluded from this specification:

1. **Multi-user support**: No shared deployments, team features, or multi-tenant architecture
2. **Sunsama integrations**: No support for Sunsama's third-party integrations (Google Calendar, Slack, etc.) - users should configure these in Sunsama web UI directly
3. **Analytics and reporting**: No dashboards, statistics, or productivity metrics beyond basic task data
4. **Mobile app parity**: No mobile-specific features or mobile client support
5. **Offline mode**: No offline task management or sync conflict resolution
6. **Custom Sunsama UI**: No web interface, GUI, or visual task board (MCP protocol only)
7. **Task templates**: No task template creation or management features
8. **Bulk operations**: No batch import/export of tasks from external sources
9. **Workflow automation**: No automatic task creation rules or scheduled task generation
10. **Admin features**: No workspace management, user permissions, or billing operations
11. **Recurring tasks**: No support for creating, modifying, or managing recurring task schedules (deferred to future roadmap)
