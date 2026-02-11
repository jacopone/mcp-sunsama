---
status: active
created: 2025-10-15
updated: 2025-10-15
type: session-note
lifecycle: ephemeral
---

# Session Notes: Calendar Entry Creation with Calendar Selection

## Feature Objective

Build Sunsama MCP tool to create calendar events with the ability to **choose which calendar** (Google, Outlook, Personal, Work, etc.) to create the event in.

## User's Primary Use Case

Calendar management assistant that can:
- Check availability across calendars
- Propose time slots
- Create events with specific calendar selection
- Send calendar invitations
- Example: "Check if I'm available next week Thursday" → "Add calendar entry 'sync with work-partner' in my Outlook calendar and send work@work.com an invitation"

## Current Status: ✅ Phase 1 - Implementation Complete

### API Research Findings (2025-10-23)

**Manual API Capture via Chrome DevTools**:
- Captured GraphQL mutation: `createCalendarEventV2`
- Key field: `organizerCalendar { calendarId, calendarDisplayName }`
- Service types: `google`, `microsoft`, `apple`, `sunsama`
- Full API documented in `research/api_findings.md`

**Critical Discovery**: Calendar events are DIFFERENT from tasks
- Tasks: To-do items (sunsama-api supports)
- Calendar Events: Time-blocked appointments with calendar integration (NOT in sunsama-api)
- GraphQL mutation: `createCalendarEventV2` (not `createTask`)

### Implementation Summary (2025-10-23)

**Files Created**:
1. `src/schemas.ts` - Added calendar event schemas (createCalendarEventSchema, getCalendarsSchema)
2. `src/utils/graphql-helper.ts` - Direct GraphQL request wrapper for operations not in sunsama-api
3. `src/tools/calendar-tools.ts` - Two new MCP tools:
   - `get-calendars` - List available calendars (Google, Microsoft, etc.)
   - `create-calendar-event` - Create calendar event with calendar selection
4. `research/api_findings.md` - Complete API documentation

**Files Modified**:
- `src/tools/index.ts` - Registered calendar tools
- `src/main.ts` - Updated server description

**Implementation Approach**:
- Used `makeGraphQLRequest()` to access Suns amaClient's internal `graphqlRequest()` method
- Bypassed sunsama-api package limitations
- Maintained compatibility with existing MCP infrastructure

**Status**: ✅ TypeScript build passed, ready for testing

### What We Know

1. **Sunsama Architecture**:
   - Integration layer on top of multiple calendar services
   - Supports: Google Calendar, Outlook, Apple Calendar, Sunsama-backed calendar
   - Time-blocked tasks sync to calendars
   - Calendar selection happens during event creation

2. **sunsama-api npm package (v0.11.2)**:
   - ✅ Exposes task operations (create, update, complete, query)
   - ❌ Does NOT expose calendar operations
   - ❌ No `getCalendars()`, no `createCalendarEvent()`, no calendar selection
   - Finding: Calendar selection likely happens as a task property

3. **Existing Sunsama MCP** (`/home/guyfawkes/sunsama-mcp`):
   - Tools: create-task, update-task, get-tasks-by-day, etc.
   - No calendar-related parameters in current implementation

### Critical Gap Identified

**Original spec was incomplete** - focused on time-blocking tasks but **missed the primary requirement**: calendar selection functionality.

### Research Approach Decided

Use **Playwright MCP** to reverse engineer Sunsama's calendar API by capturing network traffic during calendar event creation.

## Tools Installed & Configured

### 1. Microsoft Playwright MCP (Extension Mode)
- **Package**: `@playwright/mcp@latest`
- **Mode**: `--extension` (connects to existing browser with authentication)
- **Configuration**: Added to `.mcp.json`
- **Tools Available** (after restart):
  - `browser_navigate` - Navigate to Sunsama
  - `browser_click` - Interact with calendar UI
  - `browser_evaluate` - Execute JavaScript
  - `browser_console_messages` - Debug console logs

### 2. Playwright Network Monitor MCP
- **Package**: `playwright-min-network-mcp`
- **Configuration**: Added to `.mcp.json`
- **Tools Available** (after restart):
  - `start_monitor` - Launch browser & begin network capture
  - `get_recent_requests` - List captured API calls (JSON/API filtered)
  - `get_request_detail` - Get full request/response bodies by UUID
  - `update_filter` - Adjust content type/URL filters
  - `stop_monitor` - End monitoring session

### Configuration Added

**Location**: `.claude/mcp.json` (project-level configuration)

```json
{
  "mcpServers": {
    "serena": {
      "type": "stdio",
      "command": "serena",
      "args": ["start-mcp-server", "--context", "ide-assistant"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--extension"]
    },
    "network-monitor": {
      "command": "npx",
      "args": ["-y", "playwright-min-network-mcp"]
    }
  }
}
```

**Note**: Project-level MCP servers only available in this project (birthday-manager).

**System Environment**:
- Chrome location: `/run/current-system/sw/bin/google-chrome-stable`
- Chrome version: 141.0.7390.65
- NixOS package: `google-chrome` (from `nixos-config/modules/core/packages.nix:94`)

## Next Steps - Testing & Validation

### Phase 2: Integration Testing

1. **Test get-calendars tool**:
   ```bash
   # Via MCP inspector or Claude Code
   mcp__sunsama__get-calendars
   ```
   Expected: List of available calendars with calendarId and displayName

2. **Test create-calendar-event tool**:
   ```typescript
   // Example call
   mcp__sunsama__create-calendar-event({
     title: "Test Event - MCP",
     startDate: "2025-10-23T17:00:00.000Z",
     endDate: "2025-10-23T17:30:00.000Z",
     calendarId: "jacopo.anselmi@gmail.com",  // From get-calendars output
     description: "Testing calendar event creation via MCP"
   })
   ```
   Expected: Event created in specified calendar, visible in Sunsama UI

3. **Verify in Sunsama UI**:
   - Check that event appears in calendar view
   - Verify correct calendar was selected
   - Confirm event details (title, time, description)

4. **Edge Case Testing**:
   - Invalid calendarId (should error with helpful message)
   - Missing required fields (Zod validation)
   - All-day events (`isAllDay: true`)
   - Different timezones
   - Events with streams/projects assigned

### Phase 3: Documentation

- Update README with calendar tools examples
- Add usage guide for calendar selection workflow
- Document common calendar IDs for different providers

## Files Created/Modified This Session

- `/home/guyfawkes/birthday-manager/specs/006-add-calendar-entry/research/capture_calendar_api.py` (deprecated - using MCP instead)
- `/home/guyfawkes/birthday-manager/.claude/mcp.json` (updated with Playwright + Network Monitor servers)
- Chrome verified at `/run/current-system/sw/bin/google-chrome-stable` (version 141.0.7390.65)

## Key Technical Decisions

1. **Approach**: Reverse engineering via browser automation (not relying on incomplete sunsama-api)
2. **Tools**: Playwright MCP + Network Monitor MCP (better than Python script)
3. **Integration**: Extend existing sunsama-mcp server rather than creating new server
4. **Language**: TypeScript 5.x with Bun runtime (matching existing sunsama-mcp)
5. **Dependencies**: `@modelcontextprotocol/sdk`, `sunsama-api`, `zod`, `luxon`

## Blockers Resolved

- ❌ Python Playwright + NixOS dynamic linking issue → ✅ MCP-based solution
- ❌ Incomplete sunsama-api documentation → ✅ Reverse engineering approach
- ❌ Missing spec requirements → ✅ Identified need for calendar selection

## Expected API Structure (Hypothesis)

Based on Sunsama's architecture, we expect:

```typescript
// Calendar listing
GET /api/calendars
Response: {
  calendars: [
    { id: "cal_123", name: "Google - Work", provider: "google", isDefault: false },
    { id: "cal_456", name: "Outlook - Personal", provider: "outlook", isDefault: false },
    { id: "cal_sun", name: "Sunsama Calendar", provider: "sunsama", isDefault: true }
  ]
}

// Task/event creation with calendar
POST /api/tasks
{
  text: "Meeting with team",
  timeBlock: {
    startTime: "2025-10-16T10:00:00-07:00",
    duration: 60
  },
  calendarId: "cal_123"  // <-- This is what we need to find
}
```

## Context for Next Session

When resuming:
1. ✅ Chrome installed and verified (`/run/current-system/sw/bin/google-chrome-stable` v141.0.7390.65)
2. ✅ MCP servers configured in `.claude/mcp.json` (project-level)
3. ⏳ **REQUIRED**: Restart Claude Code to load new MCP servers
4. ⏳ User needs browser open with Sunsama authenticated
5. ⏳ User needs Playwright MCP extension installed in browser (will be prompted after restart)
6. 📋 Follow "Next Steps" above to capture API traffic

**MCP Configuration Hierarchy**:
- Project-level (`.claude/mcp.json`) - highest precedence ✅ Used here
- User-level (`~/.config/claude-code/mcp.json`) - lowest precedence

## References

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Playwright Network Monitor MCP](https://github.com/bun913/playwright-min-network-mcp)
- [Sunsama MCP Implementation](file:///home/guyfawkes/sunsama-mcp)
- [sunsama-api npm package](https://www.npmjs.com/package/sunsama-api)
