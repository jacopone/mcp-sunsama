# Calendar Selection API Findings

**Date**: 2025-10-23
**Method**: Manual Chrome DevTools capture
**Endpoint**: GraphQL `createCalendarEvent` mutation

## Summary

Calendar selection in Sunsama uses the `organizerCalendar` field in the calendar event creation payload. This field specifies both the calendar ID and display name.

## Key Findings

### 1. Calendar Selection Field

The calendar is selected via the `organizerCalendar` object:

```json
"organizerCalendar": {
  "calendarId": "jacopo.anselmi@gmail.com",
  "calendarDisplayName": "Jacopo Non-Work"
}
```

**Fields**:
- `calendarId` (string, required): The unique identifier for the calendar (e.g., email for Google Calendar)
- `calendarDisplayName` (string, required): Human-readable calendar name shown in UI

### 2. Related Fields

**Scheduled To** (where event appears in Sunsama):
```json
"scheduledTo": [{
  "calendarId": "jacopo.anselmi@gmail.com",
  "userId": null
}]
```

**Service Type**:
```json
"service": "google"
```

Supported values likely: `"google"`, `"microsoft"`, `"apple"`, `"sunsama"`

### 3. Full Calendar Event Structure

```json
{
  "calendarEvent": {
    "_id": "68fa511f96e7ff5fb3933bce",
    "title": "API Test Event",
    "date": {
      "startDate": "2025-10-23T17:15:00.000Z",
      "endDate": "2025-10-23T17:45:00.000Z",
      "isAllDay": null,
      "timeZone": null
    },
    "organizerCalendar": {
      "calendarId": "jacopo.anselmi@gmail.com",
      "calendarDisplayName": "Jacopo Non-Work"
    },
    "scheduledTo": [{
      "calendarId": "jacopo.anselmi@gmail.com",
      "userId": null
    }],
    "service": "google",
    "streamIds": ["659956155aee190001e00a37"],
    "status": "scheduled",
    "description": "",
    "inviteeList": [],
    "location": {
      "name": "",
      "address": "",
      "alias": "",
      "coordinate": {"lat": 0, "lng": 0}
    }
  },
  "groupId": "659956145aee190001e00a33",
  "limitResponsePayload": true
}
```

## Implementation Notes

### For MCP Server

To add calendar selection support to the Sunsama MCP server:

1. **Add calendar listing endpoint** (if not exists):
   - Query user's available calendars
   - Return list of `{calendarId, calendarDisplayName, service}` objects

2. **Extend event creation**:
   - Add optional `calendarId` parameter
   - Add optional `calendarDisplayName` parameter
   - If provided, include in `organizerCalendar` field
   - Also add to `scheduledTo` array

3. **Default behavior**:
   - If calendar not specified, use user's default calendar
   - Or require calendar parameter (fail-fast approach)

### Calendar ID Format

From the example:
- **Google Calendar**: Email address (e.g., `"jacopo.anselmi@gmail.com"`)
- **Other services**: TBD (need to capture Microsoft/Apple examples)

### Required vs Optional

Based on the capture:
- `organizerCalendar` appears to be **required** for event creation
- Both `calendarId` and `calendarDisplayName` are required fields within it
- `scheduledTo` array must contain at least one entry matching the organizer calendar

## Next Steps

1. ✅ Document findings (this file)
2. Check if sunsama-api package supports `organizerCalendar` in createTask
3. Update MCP server's `create_calendar_entry` tool to accept calendar parameters
4. Add calendar listing capability to help users choose calendars
5. Test with different calendar providers (Google, Microsoft, Apple)

## Raw GraphQL Mutation

```graphql
mutation createCalendarEvent($input: CreateCalendarEventInput!) {
  createCalendarEventV2(input: $input) {
    createdCalendarEvent {
      _id
      title
      date {
        startDate
        endDate
        isAllDay
        timeZone
      }
      organizerCalendar {
        calendarId
        calendarDisplayName
      }
      scheduledTo {
        calendarId
        userId
      }
      service
      streamIds
      status
    }
    success
  }
}
```

**Variables**: See full JSON payload in capture session.
