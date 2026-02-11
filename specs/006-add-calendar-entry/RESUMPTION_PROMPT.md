---
status: active
created: 2025-10-15
updated: 2025-10-15
type: session-note
lifecycle: ephemeral
---

# Resumption Prompt for Feature 006 - After Claude Code Restart

**Copy and paste this prompt after restarting Claude Code:**

---

Continue Feature 006: Calendar Entry Creation with Calendar Selection.

**Current Status**: Phase 0 - API Research (ready to capture network traffic)

**What's Been Done**:
- ✅ Chrome verified at `/run/current-system/sw/bin/google-chrome-stable` (v141.0.7390.65)
- ✅ Playwright MCP + Network Monitor MCP configured in `.claude/mcp.json` (project-level)
- ✅ MCP servers should now be loaded after this restart

**Your Tasks**:
1. Verify Playwright and Network Monitor MCP tools are available
2. Start network monitoring with `start_monitor` (captures JSON/API traffic by default)
3. Connect to my Chrome browser using Playwright MCP extension mode
4. Navigate to Sunsama (https://app.sunsama.com) and verify authentication
5. Guide me to create a test calendar event in Sunsama UI:
   - Title: "API Test Event"
   - Time: Today, any 1-hour slot
   - **CRITICAL**: Select a specific calendar from the dropdown
6. Capture API requests using `get_recent_requests`
7. Analyze captured requests with `get_request_detail` to find:
   - Calendar listing endpoint
   - Calendar selection parameter in event creation
8. Document findings in `specs/006-add-calendar-entry/research/api_findings.md`

**References**:
- SESSION_NOTES.md: `/home/guyfawkes/birthday-manager/specs/006-add-calendar-entry/SESSION_NOTES.md`
- README.md: `/home/guyfawkes/birthday-manager/specs/006-add-calendar-entry/README.md`

**Browser Status**: I have Chrome open with Sunsama authenticated.

Begin by verifying the MCP tools are loaded, then start the network capture workflow.

---

**Alternative Short Version** (if you just want to resume quickly):

---

Continue Feature 006 API research. MCP servers configured - verify Playwright/Network Monitor tools loaded, then start network capture workflow to reverse-engineer Sunsama calendar API. See `specs/006-add-calendar-entry/SESSION_NOTES.md` for full context.

---
