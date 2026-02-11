---
status: draft
created: 2025-10-15
updated: 2025-10-15
type: planning
lifecycle: ephemeral
---

# Feature 006: Calendar Entry Creation with Calendar Selection

## Overview

Add capability to Sunsama MCP server to create calendar events with explicit calendar selection (Google, Outlook, etc.).

## Current Status: 🔍 Phase 0 - API Research

We are currently in the research phase to discover Sunsama's undocumented calendar API endpoints.

## Quick Start (Resuming Work)

1. **Restart Claude Code** to load new MCP servers (playwright + network-monitor)
2. Open browser with Sunsama authenticated
3. Follow instructions in `SESSION_NOTES.md`

## Directory Structure

```
006-add-calendar-entry/
├── README.md                     # This file - project overview
├── SESSION_NOTES.md              # Detailed progress notes
├── research/
│   ├── capture_calendar_api.py   # (deprecated - using MCP instead)
│   └── api_findings.md           # (to be created after network capture)
└── (spec files to be created after research)
```

## User Requirement

> "I would like to be able to choose between different calendars as I hope that Claude can help me manage bookings and coordinate with different work and personal streams. For example: 'Can you check if I'm available next week Thursday and propose me a 1 hour slot?' and then 'Ok please add a calendar entry: sync with work-partner in my Outlook calendar and send work@work.com an invitation'"

## Key Features Needed

1. **List Calendars** - Get all connected calendars (Google, Outlook, etc.)
2. **Create Event with Calendar Selection** - Specify which calendar to use
3. **Time-blocking** - Set specific start time and duration
4. **Calendar Invitations** - Send invites to other participants (future enhancement)

## Research Phase Deliverables

- [ ] API endpoint for listing calendars
- [ ] API endpoint/payload for calendar selection during event creation
- [ ] Authentication requirements
- [ ] Request/response data structures
- [ ] Update `spec.md` with complete requirements
- [ ] Generate `tasks.md` for implementation

## Implementation Target

Extend existing **sunsama-mcp** server with:
- `list-calendars` tool
- Enhanced `create-task` tool with `calendarId` parameter
- Enhanced `update-task` tool to change calendar assignment

## Tools & Technologies

- **Research**: Playwright MCP + Network Monitor MCP
- **Implementation**: TypeScript 5.x with Bun runtime
- **Dependencies**: @modelcontextprotocol/sdk, sunsama-api, zod, luxon

## Related Documentation

- [Session Notes](./SESSION_NOTES.md) - Detailed progress and decisions
- [Existing Sunsama MCP](file:///home/guyfawkes/sunsama-mcp) - Current implementation
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)

## Timeline

- **Phase 0 (Current)**: API Research - Reverse engineer calendar endpoints
- **Phase 1**: Spec Update - Add calendar selection requirements
- **Phase 2**: Implementation - Extend sunsama-mcp with calendar tools
- **Phase 3**: Testing - Verify calendar selection works across providers
- **Phase 4**: Documentation - Update user guides

---

**Note**: This feature requires completing research phase before spec can be finalized. See `SESSION_NOTES.md` for current status.
