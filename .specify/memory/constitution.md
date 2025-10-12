<!--
Sync Impact Report:
- Version change: [TEMPLATE] → 1.0.0
- Initial constitution creation for Sunsama MCP Server project
- Principles defined: 5 core principles
- Added sections: Technical Constraints, Development Workflow, Governance
- Templates status:
  - ✅ plan-template.md - Constitution Check section aligns with principles
  - ✅ spec-template.md - Requirements structure supports API coverage tracking
  - ✅ tasks-template.md - Task phases support iterative API implementation
- Follow-up TODOs: None
- Notes: Initial ratification for personal-use Sunsama MCP server extending robertn702/mcp-sunsama
-->

# Sunsama MCP Server Constitution

## Core Principles

### I. Complete API Coverage

Every Sunsama feature accessible through the web application MUST be discoverable and
exposed through this MCP server. When implementing new endpoints:

- Document the feature in the Sunsama web UI that the endpoint supports
- Verify functionality matches web UI behavior exactly
- Mark features as "partial" if only subset of web UI capabilities exposed
- Maintain a coverage matrix tracking implemented vs. discovered endpoints

**Rationale**: The primary goal is comprehensive coverage beyond robertn702's
implementation. Partial implementations create confusion and reduce utility.

### II. MCP Protocol Compliance

All tools and resources MUST strictly adhere to the Model Context Protocol specification:

- Tools use proper JSON Schema for input validation
- Resources provide appropriate MIME types and content
- Prompts follow MCP prompt template structure
- Error responses use standard MCP error codes and formats
- Transport layer (stdio/SSE) implements protocol correctly

**Rationale**: Protocol compliance ensures compatibility with all MCP clients (Claude
Desktop, Cursor, etc.) and future-proofs the implementation.

### III. Resilient Error Handling (NON-NEGOTIABLE)

Since Sunsama's API is undocumented and subject to change without notice:

- MUST catch and gracefully handle all network/API errors
- MUST provide actionable error messages to users
- MUST implement retry logic with exponential backoff for transient failures
- MUST log sufficient detail for debugging API changes
- MUST version-tag responses to detect silent API schema changes

**Rationale**: Undocumented APIs change frequently. Resilient error handling prevents
cascading failures and aids rapid debugging when Sunsama updates their API.

### IV. Personal Use Optimization

Optimize for single-user, personal productivity workflows:

- Assume single Sunsama account (no multi-tenant complexity)
- Cache aggressively to reduce API calls and improve responsiveness
- Prefetch commonly-used data (today's tasks, user streams)
- Optimize for daily planning workflow patterns
- Simplify authentication (store credentials securely, no OAuth complexity)

**Rationale**: Personal-use scope allows performance optimizations impossible in
multi-tenant scenarios. Focus on speed and convenience over enterprise features.

### V. Maintainability & Documentation

Code and documentation MUST enable rapid updates when Sunsama's API changes:

- Document reverse-engineered endpoint discovery process
- Capture network request/response examples for all endpoints
- Maintain API change log tracking Sunsama version → endpoint changes
- Use TypeScript with strict typing to catch breaking changes early
- Structure code for easy endpoint addition (follow consistent patterns)

**Rationale**: Reverse-engineered APIs require ongoing maintenance. Clear documentation
and consistent patterns reduce time to fix breaks from hours to minutes.

## Technical Constraints

**Base Implementation**: Fork/extend robertn702/mcp-sunsama as starting point

**Language/Runtime**: TypeScript + Node.js (match upstream for easier integration)

**Authentication**: Email/password or session token (no OAuth, personal use only)

**API Discovery**: Browser DevTools network tab + documented request/response patterns

**Testing Strategy**:
- Unit tests for business logic and data transformations
- Integration tests against live Sunsama account (use dedicated test workspace)
- No mocking of Sunsama API (too brittle given undocumented nature)
- Manual verification checklist comparing MCP tools vs. web UI features

**Performance Targets**:
- Tool response time: <2s for cached data, <5s for fresh API calls
- Startup time: <3s (acceptable for personal use)
- Memory footprint: <100MB (single user, reasonable for personal laptop)

**Security Requirements**:
- Store credentials in system keychain (never plaintext)
- HTTPS only for Sunsama API communication
- Session token rotation following Sunsama's auth patterns
- No credential logging (even in debug mode)

## Development Workflow

**Feature Discovery Process**:
1. Use Sunsama web UI and identify feature to expose
2. Capture network requests using browser DevTools
3. Document request/response structure with examples
4. Test with curl/Postman to verify understanding
5. Implement in MCP server with proper typing
6. Add to coverage matrix

**API Change Detection**:
- Weekly: Check Sunsama changelog/updates for product changes
- On error: Investigate if root cause is API schema change
- Maintain version pinning strategy (document Sunsama web app version tested against)

**Quality Gates**:
- All TypeScript code passes strict type checking
- All tools include JSON Schema validation
- All endpoints documented with request/response examples
- Coverage matrix updated for each new feature
- Manual verification performed in Claude Desktop or Cursor

**Release Strategy**:
- Personal use = no formal releases needed
- Git tags for stable checkpoints (tag after verified working state)
- Branch per feature to isolate WIP from working implementation

## Governance

**Constitution Authority**: This constitution defines the standards for Sunsama MCP
Server development. All implementation decisions and code reviews MUST verify compliance
with these principles.

**Amendment Process**:
- Amendments permitted when principles conflict with practical implementation reality
- Document rationale for amendment in commit message and this file
- Increment version following semantic versioning rules
- Update sync impact report with affected templates

**Versioning Policy**:
- MAJOR: Principle removal or backward-incompatible governance change
- MINOR: New principle added or existing principle materially expanded
- PATCH: Clarifications, wording improvements, non-semantic changes

**Compliance Review**:
- Before implementing new feature: verify approach aligns with principles I-V
- After API changes break functionality: verify fixes maintain principle compliance
- Quarterly: review coverage matrix to ensure progress toward complete API coverage

**Runtime Guidance**: The agent-file-template.md will contain extracted technical context
from implemented features (active technologies, project structure, common patterns).

**Version**: 1.0.0 | **Ratified**: 2025-10-12 | **Last Amended**: 2025-10-12
