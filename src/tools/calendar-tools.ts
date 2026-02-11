/**
 * Calendar Event Tools
 *
 * Tools for managing Sunsama calendar events (time-blocked appointments).
 * Uses direct GraphQL requests since calendar events are not yet supported
 * by the sunsama-api package.
 */

import { SunsamaClient } from "sunsama-api";
import type {
  CreateCalendarEventInput,
  GetCalendarsInput,
} from "../schemas.js";
import {
  createCalendarEventSchema,
  getCalendarsSchema,
} from "../schemas.js";
import {
  formatJsonResponse,
  formatTsvResponse,
  withTransportClient,
  type ToolContext,
} from "./shared.js";
import {
  makeGraphQLRequest,
  CALENDAR_QUERIES,
  CALENDAR_MUTATIONS,
} from "../utils/graphql-helper.js";
import { getUserTimezone } from "./task-helpers.js";

/**
 * Tool to list available calendars for the authenticated user
 */
export const getCalendarsTool = withTransportClient({
  name: "get-calendars",
  description:
    "Get list of available calendars (Google, Microsoft, etc.) for creating calendar events",
  parameters: getCalendarsSchema,
  execute: async (_args: GetCalendarsInput, context: ToolContext) => {
    const data = await makeGraphQLRequest(
      context.client,
      CALENDAR_QUERIES.GET_CALENDARS,
    );

    if (!data?.currentUser?.calendar?.items) {
      throw new Error("No calendar data received");
    }

    // Extract calendars from unified calendar.items array
    const calendars: any[] = [];

    for (const item of data.currentUser.calendar.items) {
      if (item.google) {
        calendars.push({
          calendarId: item.id,
          displayName: item.google.summaryOverride || item.google.summary,
          service: "google",
          selected: item.google.selected,
          accessRole: item.google.accessRole,
          timeZone: item.google.timeZone,
        });
      } else if (item.microsoft) {
        calendars.push({
          calendarId: item.microsoft.id,
          displayName: item.microsoft.name,
          service: "microsoft",
          isDefault: item.microsoft.isDefaultCalendar,
          canEdit: item.microsoft.canEdit,
          color: item.microsoft.hexColor || item.microsoft.color,
        });
      }
    }

    return formatTsvResponse(calendars);
  },
});

/**
 * Tool to create a calendar event with calendar selection
 */
export const createCalendarEventTool = withTransportClient({
  name: "create-calendar-event",
  description:
    "Create a time-blocked calendar event in a specific calendar with specified start/end times",
  parameters: createCalendarEventSchema,
  execute: async (
    {
      title,
      startDate,
      endDate,
      calendarId,
      calendarDisplayName,
      description,
      location,
      streamIds,
      isAllDay,
      timeZone,
    }: CreateCalendarEventInput,
    context: ToolContext,
  ) => {
    // If calendar display name not provided, we'll need to fetch it
    let resolvedCalendarDisplayName = calendarDisplayName;
    if (!resolvedCalendarDisplayName) {
      // Fetch calendars to get display name
      const calendarData = await makeGraphQLRequest(
        context.client,
        CALENDAR_QUERIES.GET_CALENDARS,
      );

      // Find matching calendar
      let found = false;
      if (calendarData?.currentUser?.calendar?.items) {
        for (const item of calendarData.currentUser.calendar.items) {
          if (item.id === calendarId && item.google) {
            resolvedCalendarDisplayName = item.google.summaryOverride ||
              item.google.summary;
            found = true;
            break;
          } else if (item.microsoft?.id === calendarId) {
            resolvedCalendarDisplayName = item.microsoft.name;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        throw new Error(
          `Calendar not found: ${calendarId}. Use get-calendars to list available calendars.`,
        );
      }
    }

    // Get group ID from client
    const userTimezone = timeZone || await getUserTimezone(context);

    // Generate event ID
    const eventId = SunsamaClient.generateTaskId();

    // Determine service type from calendarId format
    // Google uses email format, Microsoft uses GUID-like IDs
    const service = calendarId.includes("@") ? "google" : "microsoft";

    // Build calendar event payload matching the captured API structure
    const calendarEvent = {
      _id: eventId,
      createdBy: "", // Will be filled by API
      date: {
        startDate,
        endDate,
        isAllDay: isAllDay || null,
        timeZone: userTimezone || null,
      },
      inviteeList: [],
      location: location
        ? {
          name: location,
          address: "",
          alias: "",
          coordinate: { lat: 0, lng: 0 },
        }
        : {
          name: "",
          address: "",
          alias: "",
          coordinate: { lat: 0, lng: 0 },
        },
      staticMapUrl: "",
      status: "scheduled",
      title,
      createdAt: new Date().toISOString(),
      scheduledTo: [{
        calendarId,
        userId: null,
      }],
      organizerCalendar: {
        calendarId,
        calendarDisplayName: resolvedCalendarDisplayName,
      },
      service,
      serviceIds: {
        google: null,
        microsoft: null,
        microsoftUniqueId: null,
        apple: null,
        appleRecurrenceId: null,
        sunsama: null,
      },
      description: description || "",
      sequence: 0,
      streamIds: streamIds || [],
      lastModified: new Date().toISOString(),
      permissions: {
        guestsCanModify: null,
        guestsCanInviteOthers: null,
        guestsCanSeeOtherGuests: null,
        anyoneCanAddSelf: null,
        locked: null,
        privateCopy: null,
      },
      hangoutLink: "",
      googleCalendarURL: "",
      transparency: "opaque",
      visibility: "default",
      googleLocation: null,
      conferenceData: null,
      recurringEventInfo: null,
      runDate: null,
      agenda: [],
      outcomes: [],
      childTasks: [],
      visualizationPreferences: [],
      seedTask: null,
      eventType: "default",
    };

    // Get user data for groupId
    const user = await context.client.getUser();
    const groupId = user.primaryGroup?.groupId;

    if (!groupId) {
      throw new Error("Unable to determine group ID from user data");
    }

    const variables = {
      input: {
        calendarEvent,
        groupId,
        limitResponsePayload: true,
      },
    };

    const result = await makeGraphQLRequest(
      context.client,
      CALENDAR_MUTATIONS.CREATE_CALENDAR_EVENT,
      variables,
    );

    if (!result?.createCalendarEventV2) {
      throw new Error("Calendar event creation failed");
    }

    const response = result.createCalendarEventV2;

    return formatJsonResponse({
      success: response.success,
      eventId: response.createdCalendarEvent?._id,
      title,
      calendarId,
      calendarDisplayName: resolvedCalendarDisplayName,
      startDate,
      endDate,
      created: true,
      event: response.createdCalendarEvent,
    });
  },
});

/**
 * Export all calendar tools
 */
export const calendarTools = [
  getCalendarsTool,
  createCalendarEventTool,
];
