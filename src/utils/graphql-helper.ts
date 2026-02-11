/**
 * GraphQL Helper Utilities
 *
 * Provides direct GraphQL request capabilities for operations not yet supported
 * by the sunsama-api package (e.g., calendar events).
 */

import type { SunsamaClient } from "sunsama-api";

/**
 * Makes a raw GraphQL request using the SunsamaClient's internal graphqlRequest method.
 * This allows us to call GraphQL operations not yet exposed by the sunsama-api package.
 *
 * @param client - SunsamaClient instance (must be authenticated)
 * @param query - GraphQL query or mutation string
 * @param variables - Variables for the GraphQL operation
 * @returns GraphQL response data
 */
export async function makeGraphQLRequest(
  client: SunsamaClient,
  query: string,
  variables?: Record<string, any>,
): Promise<any> {
  // Access the internal graphqlRequest method
  // @ts-ignore - accessing private method intentionally for calendar events
  const response = await client.graphqlRequest({
    query,
    variables,
  });

  if (response.errors) {
    const errorMessages = response.errors.map((e: any) => e.message).join(", ");
    throw new Error(`GraphQL Error: ${errorMessages}`);
  }

  return response.data;
}

/**
 * GraphQL fragments for calendar operations
 */
export const CALENDAR_FRAGMENTS = {
  CalendarItem: `
    fragment CalendarItem on CalendarItem {
      id
      accountId
      google {
        summary
        summaryOverride
        timeZone
        selected
        accessRole
        accountId
        __typename
      }
      microsoft {
        id
        name
        color
        hexColor
        isDefaultCalendar
        canShare
        canViewPrivateItems
        canEdit
        isRemovable
        allowedOnlineMeetingProviders
        __typename
      }
      __typename
    }
  `,

  CalendarEvent: `
    fragment CalendarEvent on CalendarEvent {
      _id
      createdBy
      date {
        startDate
        endDate
        isAllDay
        timeZone
        __typename
      }
      title
      description
      location {
        name
        address
        alias
        coordinate {
          lat
          lng
          __typename
        }
        __typename
      }
      organizerCalendar {
        calendarId
        calendarDisplayName
        __typename
      }
      scheduledTo {
        calendarId
        userId
        __typename
      }
      service
      streamIds
      status
      createdAt
      lastModified
      __typename
    }
  `,
};

/**
 * GraphQL queries for calendar operations
 */
export const CALENDAR_QUERIES = {
  /**
   * Query to get user's available calendars
   */
  GET_CALENDARS: `
    query getCalendars {
      user {
        _id
        groupId
        services {
          google {
            calendars {
              items {
                ...CalendarItem
              }
              __typename
            }
            __typename
          }
          microsoft {
            calendars {
              items {
                ...CalendarItem
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
    }
    ${CALENDAR_FRAGMENTS.CalendarItem}
  `,
};

/**
 * GraphQL mutations for calendar operations
 */
export const CALENDAR_MUTATIONS = {
  /**
   * Mutation to create a calendar event
   */
  CREATE_CALENDAR_EVENT: `
    mutation createCalendarEvent($input: CreateCalendarEventInput!) {
      createCalendarEventV2(input: $input) {
        createdCalendarEvent {
          ...CalendarEvent
        }
        success
        __typename
      }
    }
    ${CALENDAR_FRAGMENTS.CalendarEvent}
  `,
};
