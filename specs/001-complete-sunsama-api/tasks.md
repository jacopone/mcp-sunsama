---
status: active
created: 2025-10-12
updated: 2025-10-12
type: planning
lifecycle: ephemeral
---

# Tasks: Complete Sunsama API Coverage

**Input**: Design documents from `/home/guyfawkes/sunsama-mcp/specs/001-complete-sunsama-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Clone/fork robertn702/mcp-sunsama repository to local development environment
- [ ] T002 Install project dependencies using `npm install` or `bun install` per package.json
- [ ] T003 [P] Verify existing test suite passes with `bun test` to establish baseline
- [ ] T004 [P] Create feature branch `001-complete-sunsama-api` from main/master
- [ ] T005 [P] Set up credential storage using setup CLI: verify keytar/keychain integration works on development machine

**Checkpoint**: Development environment configured, existing tests passing, credentials stored securely

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Cache Infrastructure
- [ ] T006 Create `/home/guyfawkes/sunsama-mcp/src/services/cache.ts` implementing LRU cache with 30-second TTL using lru-cache library (install dependency)
- [ ] T007 [P] Add cache configuration to `/home/guyfawkes/sunsama-mcp/src/config/` with TTL constants per data type (tasks: 30s, user: 5min, streams: 5min)
- [ ] T008 [P] Implement cache invalidation helpers in `/home/guyfawkes/sunsama-mcp/src/services/cache.ts`: clearTaskCache(taskId), clearDayCache(date), clearBacklogCache()

### Schema Validation
- [ ] T009 Create `/home/guyfawkes/sunsama-mcp/src/models/task.ts` with Zod schemas from data-model.md: TaskSchema, TaskUpdateSchema, TaskCreateSchema
- [ ] T010 [P] Create `/home/guyfawkes/sunsama-mcp/src/models/user.ts` with UserSchema from data-model.md
- [ ] T011 [P] Create `/home/guyfawkes/sunsama-mcp/src/models/channel.ts` with ChannelSchema from data-model.md
- [ ] T012 Create `/home/guyfawkes/sunsama-mcp/src/services/schema-validator.ts` with validateTaskResponse(), validateUserResponse(), validateChannelResponse() functions using Zod

### Error Handling & Resilience
- [ ] T013 Create `/home/guyfawkes/sunsama-mcp/src/utils/error-handler.ts` implementing exponential backoff retry logic (3 attempts, 100ms/200ms/400ms delays)
- [ ] T014 [P] Create custom error classes in `/home/guyfawkes/sunsama-mcp/src/utils/errors.ts`: SunsamaAPIError, ValidationError, AuthenticationError with MCP error codes
- [ ] T015 Extend `/home/guyfawkes/sunsama-mcp/src/services/sunsama-client.ts` to wrap all API calls with retry logic and error handling from T013

### Timezone Handling
- [ ] T016 Create `/home/guyfawkes/sunsama-mcp/src/utils/date-utils.ts` with timezone-aware date parsing/formatting functions using luxon or date-fns-tz library
- [ ] T017 [P] Add parseDate(dateString, timezone), formatDate(date, timezone), getCurrentDate(timezone) helper functions

### Coverage Tracking Infrastructure
- [ ] T018 Create `/home/guyfawkes/sunsama-mcp/src/utils/coverage-tracker.ts` implementing API monitoring: recordRequest(), getStats(), detectSchemaChanges()
- [ ] T019 [P] Create `/home/guyfawkes/sunsama-mcp/docs/COVERAGE_MATRIX.md` as markdown version of contracts/coverage-matrix.json with initial endpoint status

**Checkpoint**: Foundation ready - cache, validation, error handling, timezone support, and coverage tracking all operational

---

## Phase 3: User Story 1 - Daily Planning Workflow (Priority: P1) 🎯 MVP

**Goal**: Enable AI assistants to manage daily tasks through natural language - retrieve today's tasks, create new tasks, mark tasks complete, and reschedule tasks

**Independent Test**: Ask AI "show me today's tasks", "create a task for tomorrow", "mark task X as complete", verify operations match Sunsama web UI

### Implementation for User Story 1

- [ ] T020 [P] [US1] Update get-tasks-by-day tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add cache integration (read from cache, 30s TTL), timezone-aware date parsing
- [ ] T021 [P] [US1] Update get-task-by-id tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add cache integration, Zod validation of response using TaskSchema
- [ ] T022 [US1] Update create-task tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add past date warning (FR-010), bypass cache on write, invalidate day cache after creation
- [ ] T023 [US1] Update update-task-complete tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: set completedAt timestamp, bypass cache, invalidate task and day caches
- [ ] T024 [US1] Update update-task-scheduled-date tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: handle null (move to backlog per FR-014), past date warning, invalidate old and new day caches
- [ ] T025 [US1] Update update-task-text tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: validate text length (1-500 chars per FR-015), bypass cache, invalidate task cache
- [ ] T026 [US1] Update delete-task tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add confirmation parameter check (FR-021), return task metadata for client confirmation, invalidate all related caches

### User and Timezone Support
- [ ] T027 [US1] Update get-user tool in `/home/guyfawkes/sunsama-mcp/src/tools/user.ts`: add cache integration (5min TTL), validate response with UserSchema, expose timezone field
- [ ] T028 [US1] Integrate user timezone into all date operations: modify task tools to fetch user timezone and pass to date-utils functions

**Checkpoint**: User Story 1 complete - daily planning workflow fully functional with caching, error handling, and timezone support

---

## Phase 4: User Story 2 - Backlog and Future Task Management (Priority: P2)

**Goal**: Enable AI assistants to manage backlog tasks and schedule future work - view backlog, add tasks to backlog, schedule backlog tasks

**Independent Test**: Ask AI "show my backlog", "add task to backlog", "schedule backlog task for next Tuesday", verify operations work without daily planning features

### Implementation for User Story 2

- [ ] T029 [P] [US2] Update get-tasks-backlog tool in `/home/guyfawkes/sunsama-mcp/src/tools/backlog.ts` (or extend tasks.ts): add pagination support (limit/offset per FR-005), cache integration (30s TTL), validate with TaskSchema array
- [ ] T030 [US2] Enhance create-task tool: when scheduledDate is null, task goes to backlog (FR-008), invalidate backlog cache on creation
- [ ] T031 [US2] Enhance update-task-scheduled-date tool: moving to backlog (scheduledDate=null) invalidates backlog cache (FR-014)
- [ ] T032 [P] [US2] Implement update-task-snooze tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add snoozeDate field support (nullable), validate future date, invalidate task and day caches

**Checkpoint**: User Story 2 complete - backlog management fully functional, can be tested independently of US1

---

## Phase 5: User Story 3 - Task Timeboxing and Focus Mode (Priority: P2)

**Goal**: Enable AI assistants to manage task time estimates for capacity planning - set time estimates, view planned time, update estimates

**Independent Test**: Create task with "2 hour time estimate", verify estimate is stored, update estimate to "90 minutes", verify update

### Implementation for User Story 3

- [ ] T033 [P] [US3] Implement update-task-time-estimate tool in `/home/guyfawkes/sunsama-mcp/src/tools/timeboxing.ts` (or extend tasks.ts): validate plannedTime range (0-1440 minutes per FR-017), support null to clear estimate, bypass cache and invalidate
- [ ] T034 [US3] Enhance create-task tool: add plannedTime parameter validation (0-1440 minutes), include in task creation request
- [ ] T035 [US3] Enhance task retrieval tools (get-tasks-by-day, get-task-by-id, get-tasks-backlog): ensure plannedTime and actualTime fields are included in response schema

**Checkpoint**: User Story 3 complete - time estimation fully functional, can be tested independently

---

## Phase 6: User Story 4 - Task Notes and Context Management (Priority: P3)

**Goal**: Enable AI assistants to read and update task notes for context tracking - add notes, update notes with intelligent append/replace

**Independent Test**: Create task with notes, verify notes stored, "add note" appends with newline, "update note" replaces entirely

### Implementation for User Story 4

- [ ] T036 [P] [US4] Implement update-task-notes tool in `/home/guyfawkes/sunsama-mcp/src/tools/notes.ts` (or extend tasks.ts): add operation parameter (append/replace per FR-016), validate notes length (max 10000 chars), implement intelligent merge logic
- [ ] T037 [US4] ~~Implement intelligent note merging in `/home/guyfawkes/sunsama-mcp/src/services/note-merger.ts`~~ *REMOVED: Note merge logic simplified - the `update-task-notes` tool passes content directly to Sunsama API. AI clients handle merge logic when interpreting user intent.*
- [ ] T038 [US4] Enhance create-task tool: add notes parameter support, validate max length
- [ ] T039 [US4] Enhance task retrieval tools: ensure notes field is included in all task responses

**Checkpoint**: User Story 4 complete - notes management fully functional with intelligent merge behavior

---

## Phase 7: User Story 5 - Channel/Stream Organization (Priority: P3)

**Goal**: Enable AI assistants to organize tasks by channel/stream for project separation - list channels, assign tasks to channels, move tasks between channels

**Independent Test**: Ask "what channels do I have", assign task to specific channel, verify channel assignment in Sunsama web UI

### Implementation for User Story 5

- [ ] T040 [P] [US5] Update get-streams tool in `/home/guyfawkes/sunsama-mcp/src/tools/stream-tools.ts`: add cache integration (5min TTL), validate response with ChannelSchema array, implement proper error handling
- [ ] T041 [P] [US5] Create get-channels tool as alias in `/home/guyfawkes/sunsama-mcp/src/tools/stream-tools.ts`: same implementation as get-streams for improved discoverability (per user-tools.json). Note: Enhances T040, not a blocking dependency - can be implemented anytime after T040 completes.
- [ ] T042 [US5] Implement update-task-channel tool in `/home/guyfawkes/sunsama-mcp/src/tools/tasks.ts`: add streamId parameter (nullable per FR-018), validate stream exists, invalidate stream and task caches
- [ ] T043 [US5] Enhance create-task tool: add streamId parameter support, validate stream exists before creating
- [ ] T044 [US5] Enhance task retrieval tools: ensure streamId and streamName fields are included in all task responses

**Checkpoint**: User Story 5 complete - channel organization fully functional

---

## Phase 8: User Story 6 - Archived Task History (Priority: P3)

**Goal**: Enable AI assistants to review completed and archived tasks for reflection - retrieve archived tasks by date range, view task details from history

**Independent Test**: Ask "what did I complete last week", specify date range, verify archived tasks are retrieved with full details

### Implementation for User Story 6

- [ ] T045 [P] [US6] Update get-archived-tasks tool in `/home/guyfawkes/sunsama-mcp/src/tools/archive.ts` (or extend tasks.ts): add date range filtering (startDate/endDate per FR-003), pagination support (limit/offset per FR-005), cache integration (10min TTL for historical data)
- [ ] T046 [US6] Add date range validation in `/home/guyfawkes/sunsama-mcp/src/utils/date-utils.ts`: validateDateRange(startDate, endDate) ensures start <= end, reasonable range (max 1 year)
- [ ] T047 [US6] Enhance archived tasks retrieval: ensure completedAt, archived fields are properly populated in response schema

**Checkpoint**: User Story 6 complete - archived task history fully accessible

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, documentation, and quality assurance

### Documentation
- [ ] T048 [P] Create `/home/guyfawkes/sunsama-mcp/docs/API_DISCOVERY.md` documenting API discovery process via browser DevTools per research.md
- [ ] T049 [P] Create `/home/guyfawkes/sunsama-mcp/docs/endpoints/` directory with markdown files per endpoint: get-tasks-by-day.md, create-task.md, etc. (example requests/responses)
- [ ] T050 [P] Update `/home/guyfawkes/sunsama-mcp/README.md` with setup instructions, credential management via setup CLI, MCP client configuration examples
- [ ] T051 [P] Create `/home/guyfawkes/sunsama-mcp/docs/QUICKSTART.md` from quickstart template: installation, setup, basic usage examples per plan.md Phase 1 output

### Error Handling Enhancement
- [ ] T052 [P] Add comprehensive error messages with actionable guidance across all tools (per FR-030): map API error codes to user-friendly messages
- [ ] T053 [P] Implement API version detection in `/home/guyfawkes/sunsama-mcp/src/services/sunsama-client.ts`: log version mismatches, detect schema changes per research.md best practices

### Coverage Tracking & Monitoring
- [ ] T054 Update `/home/guyfawkes/sunsama-mcp/docs/COVERAGE_MATRIX.md`: mark all implemented tools as "implemented", update implementedDate, testedDate fields
- [ ] T055 [P] Implement coverage statistics in `/home/guyfawkes/sunsama-mcp/src/utils/coverage-tracker.ts`: calculateCoveragePercentage(), generateSummaryReport()
- [ ] T056 Add logging for API monitoring: instrument all API calls to track success/failure rates, detect endpoint changes

### Security Hardening
- [ ] T057 [P] Audit all logging statements: ensure no credentials or sensitive data are logged (per FR-041, research.md security best practices)
- [ ] T058 [P] Add credential validation in setup CLI: test credentials against Sunsama API before storing in keychain
- [ ] T059 Ensure all API communication uses HTTPS exclusively (per FR-039): verify sunsama-client.ts configuration

### Performance Optimization
- [ ] T060 [P] Add cache hit/miss metrics in `/home/guyfawkes/sunsama-mcp/src/services/cache.ts`: track performance, log cache effectiveness
- [ ] T061 Optimize cache keys in `/home/guyfawkes/sunsama-mcp/src/services/cache.ts`: ensure efficient invalidation patterns, minimize over-invalidation

### Code Quality
- [ ] T062 [P] Run linter and formatter across all modified files: ensure code style consistency with existing codebase
- [ ] T063 [P] Add JSDoc comments to all new functions: document parameters, return types, error conditions
- [ ] T064 [P] Review all Zod schemas: ensure error messages are clear and actionable
- [ ] T069 [P] Validate MCP protocol compliance: test server with `@modelcontextprotocol/inspector` or manual MCP client verification, ensure JSON Schema generation from Zod works correctly, verify error codes match MCP standard (-32600, -32603, etc.)
- [ ] T070 [P] Performance testing: validate response times meet success criteria (SC-003: <2s cached, SC-004: <5s fresh, SC-005: <3s create/update, SC-006: <3s startup), measure cache hit rates with T060 metrics, test with realistic workload (100-200 tasks)
- [ ] T071 [P] Security audit: verify all API communication uses HTTPS (SC-014), confirm zero credential leaks in logs including error conditions (SC-015, FR-041), test environment variable credential handling for stdio transport, validate HTTP Basic Auth parsing for HTTP transport, ensure no plaintext credential storage

### Validation & Testing
- [ ] T065 Manual integration testing: test each user story's acceptance scenarios from spec.md against live Sunsama account
- [ ] T066 Verify quickstart.md instructions: follow setup steps from scratch, ensure all commands work
- [ ] T067 Test MCP server with Claude Desktop: verify all tools are discoverable and functional
- [ ] T068 Test edge cases: timezone boundaries, past date warnings, cache invalidation, error recovery with retry logic

**Checkpoint**: All polish tasks complete - project ready for production use

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) OR sequentially in priority order (P1 → P2 → P3)
  - Each user story is independently implementable and testable
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) - Enhances US1 tools but independently testable
- **User Story 3 (P2)**: Depends on Foundational (Phase 2) - Enhances US1 tools but independently testable
- **User Story 4 (P3)**: Depends on Foundational (Phase 2) - Enhances US1 tools but independently testable
- **User Story 5 (P3)**: Depends on Foundational (Phase 2) - Enhances US1 tools but independently testable
- **User Story 6 (P3)**: Depends on Foundational (Phase 2) - Completely independent of other stories

### Critical Path (MVP - User Story 1 Only)

1. Phase 1: Setup (T001-T005) → ~1 hour
2. Phase 2: Foundational (T006-T019) → ~8 hours
3. Phase 3: User Story 1 (T020-T028) → ~6 hours
4. **STOP**: Test US1 independently, validate against acceptance scenarios
5. Optional: Phase 9 (Polish) for production readiness → ~4 hours

**Total MVP Time**: ~19 hours

### Full Implementation Path (All User Stories)

1. Phase 1: Setup → ~1 hour
2. Phase 2: Foundational → ~8 hours
3. Phase 3-8: All User Stories (can parallelize) → ~18 hours sequential, ~6 hours if 3 developers in parallel
4. Phase 9: Polish → ~8 hours

**Total Full Implementation**: ~35 hours sequential, ~23 hours with parallel team

### Within Each User Story

- Tasks marked [P] can run in parallel (different files, no dependencies)
- Cache-related tasks (T006-T008) must complete before tool updates
- Schema tasks (T009-T012) must complete before validation in tools
- Error handling (T013-T015) must complete before tool updates
- Tool enhancements should follow order: read operations → create operations → update operations

### Parallel Opportunities

**Phase 2 (Foundational) - Maximum parallelization**:
- Developer A: Cache infrastructure (T006-T008)
- Developer B: Schema validation (T009-T012)
- Developer C: Error handling (T013-T015)
- Developer D: Timezone handling (T016-T017)
- Developer E: Coverage tracking (T018-T019)

**User Stories (Phase 3-8) - After Foundational complete**:
- Developer A: User Story 1 (P1) → T020-T028
- Developer B: User Story 2 (P2) → T029-T032
- Developer C: User Story 3 (P2) → T033-T035
- Developer D: User Story 4 (P3) → T036-T039
- Developer E: User Story 5 (P3) → T040-T044
- Developer F: User Story 6 (P3) → T045-T047

All stories converge at Phase 9 (Polish)

---

## Implementation Strategy

### MVP First (User Story 1 Only - Recommended)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T019) - CRITICAL foundation
3. Complete Phase 3: User Story 1 (T020-T028)
4. **STOP and VALIDATE**:
   - Test all US1 acceptance scenarios from spec.md
   - Verify operations match Sunsama web UI
   - Test with Claude Desktop MCP client
5. Optionally add Phase 9 (Polish) tasks: T048-T051, T057-T059 for production readiness
6. Deploy/demo MVP

**Rationale**: Delivers core daily planning workflow (highest priority P1) in ~19 hours, validates architecture and approach before expanding

### Incremental Delivery (Add Stories Sequentially)

1. Setup + Foundational → Foundation ready (~9 hours)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! +6 hours)
3. Add User Story 2 → Test independently → Deploy/Demo (+4 hours)
4. Add User Story 3 → Test independently → Deploy/Demo (+3 hours)
5. Add User Story 4 → Test independently → Deploy/Demo (+4 hours)
6. Add User Story 5 → Test independently → Deploy/Demo (+5 hours)
7. Add User Story 6 → Test independently → Deploy/Demo (+3 hours)
8. Polish phase → Final production hardening (+8 hours)

**Rationale**: Each story adds incremental value, can stop at any point with working features, de-risks implementation

### Parallel Team Strategy (3+ Developers)

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together (~9 hours)
2. **Week 2**: Once Foundational is done, split into 3 teams:
   - Team A: US1 (P1) + US4 (P3) - Daily planning + Notes
   - Team B: US2 (P2) + US6 (P3) - Backlog + Archive
   - Team C: US3 (P2) + US5 (P3) - Timeboxing + Channels
3. **Week 3**: All teams converge for Phase 9 (Polish), integration testing
4. Stories complete and integrate independently, no merge conflicts (different files)

**Rationale**: Maximizes parallelization, minimizes blocking, stories remain independently testable

---

## Parallel Example: Foundational Phase (Phase 2)

All these tasks can run simultaneously (different files):

```bash
# Cache infrastructure (Developer A)
Task T006: Create src/services/cache.ts
Task T007: Add cache configuration to src/config/
Task T008: Implement cache invalidation helpers

# Schema validation (Developer B)
Task T009: Create src/models/task.ts with Zod schemas
Task T010: Create src/models/user.ts
Task T011: Create src/models/channel.ts
Task T012: Create src/services/schema-validator.ts

# Error handling (Developer C)
Task T013: Create src/utils/error-handler.ts
Task T014: Create src/utils/errors.ts
Task T015: Extend src/services/sunsama-client.ts

# Timezone handling (Developer D)
Task T016: Create src/utils/date-utils.ts
Task T017: Add timezone helper functions

# Coverage tracking (Developer E)
Task T018: Create src/utils/coverage-tracker.ts
Task T019: Create docs/COVERAGE_MATRIX.md
```

**Time savings**: 5 developers complete 8 hours of work in ~2 hours

---

## Parallel Example: User Story 1 (Phase 3)

```bash
# These can run in parallel (different tools, no shared state):
Task T020: Update get-tasks-by-day tool (Developer A)
Task T021: Update get-task-by-id tool (Developer A)
Task T027: Update get-user tool (Developer B)

# These are sequential (depend on each other):
Task T022: Update create-task tool (after T020-T021)
Task T023: Update update-task-complete tool (after T022)
Task T024: Update update-task-scheduled-date tool (after T022)
Task T025: Update update-task-text tool (after T022)
Task T026: Update delete-task tool (after T022)
Task T028: Integrate user timezone (after T027, requires all tools updated)
```

**Time savings**: 2 developers reduce 6 hours to ~4 hours with parallel start

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Foundational phase (Phase 2) is CRITICAL** - all user stories depend on it
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **File paths are absolute** from repository root: `/home/guyfawkes/sunsama-mcp/...`
- **Test strategy**: Manual integration testing against live Sunsama account (no mocking per research.md)
- **Success criteria**: Each user story's acceptance scenarios from spec.md must pass

---

## Task Count Summary

- **Phase 1 (Setup)**: 5 tasks (~1 hour)
- **Phase 2 (Foundational)**: 14 tasks (~8 hours) - BLOCKING
- **Phase 3 (US1 - P1)**: 9 tasks (~6 hours) - MVP
- **Phase 4 (US2 - P2)**: 4 tasks (~4 hours)
- **Phase 5 (US3 - P2)**: 3 tasks (~3 hours)
- **Phase 6 (US4 - P3)**: 4 tasks (~4 hours)
- **Phase 7 (US5 - P3)**: 5 tasks (~5 hours)
- **Phase 8 (US6 - P3)**: 3 tasks (~3 hours)
- **Phase 9 (Polish)**: 24 tasks (~10 hours)

**Total**: 71 tasks, ~44 hours sequential, ~22 hours with optimal parallelization (5 developers)

---

## Traceability Matrix

### User Stories → Tasks

- **US1 (Daily Planning)**: T020-T028 (9 tasks)
- **US2 (Backlog Management)**: T029-T032 (4 tasks)
- **US3 (Task Timeboxing)**: T033-T035 (3 tasks)
- **US4 (Task Notes)**: T036-T039 (4 tasks)
- **US5 (Channel Organization)**: T040-T044 (5 tasks)
- **US6 (Archived History)**: T045-T047 (3 tasks)

### Functional Requirements → Tasks

High-priority FR coverage (subset):

- **FR-001** (Get tasks by day): T020
- **FR-002** (Get backlog): T029
- **FR-003** (Get archived): T045
- **FR-006-FR-011** (Create task): T022, T030, T034, T038, T043
- **FR-012** (Mark complete): T023
- **FR-013-FR-014** (Reschedule/move to backlog): T024, T031
- **FR-015** (Update text): T025
- **FR-016** (Update notes with intelligent merge): T036-T037
- **FR-017** (Update time estimate): T033
- **FR-018** (Update channel): T042
- **FR-019** (Update snooze): T032
- **FR-020-FR-021** (Delete task): T026
- **FR-022, FR-024** (Get user, timezone): T027-T028
- **FR-023** (Get channels): T040-T041
- **FR-029-FR-035** (Error handling, caching): T006-T015, T052-T053
- **FR-036-FR-041** (Security, credentials): T005, T057-T059

All 41 functional requirements from spec.md are covered across tasks.

---

## Risk Mitigation

**Risk**: Foundational phase (Phase 2) takes longer than estimated
**Mitigation**: Parallelize all 14 tasks across team, build incrementally with unit tests

**Risk**: Sunsama API changes during implementation
**Mitigation**: T053 implements API version detection, T018 implements change monitoring, coverage matrix tracks status

**Risk**: Cache invalidation logic misses edge cases
**Mitigation**: T060 adds cache metrics, extensive testing with T065, 30s TTL provides safety net

**Risk**: Timezone handling bugs
**Mitigation**: T016-T017 create dedicated date utilities, T028 centralizes timezone integration, manual testing across timezones in T065

**Risk**: User stories not truly independent
**Mitigation**: Each phase has "Independent Test" validation, checkpoints enforce testing before proceeding

---

**Document Status**: Active
**Last Updated**: 2025-10-12
**Total Estimated Effort**: 44 hours (sequential), 22 hours (parallelized)
**MVP Effort**: 19 hours (US1 only + foundation)
