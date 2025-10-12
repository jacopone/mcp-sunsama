import { DateTime } from 'luxon';

/**
 * Timezone-aware date utilities for Sunsama MCP server
 * Constitution FR-024: All date operations must respect user timezone
 */

/**
 * Parse date string in user's timezone
 *
 * @param dateString - ISO date string (YYYY-MM-DD or ISO8601 datetime)
 * @param userTimezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns DateTime object in user's timezone
 */
export function parseDate(dateString: string, userTimezone: string): DateTime {
  // Check if date-only (YYYY-MM-DD) or datetime
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Date-only: parse as start of day in user's timezone
    return DateTime.fromISO(dateString, { zone: userTimezone });
  } else {
    // Datetime: parse with timezone
    return DateTime.fromISO(dateString, { zone: userTimezone });
  }
}

/**
 * Format date for API (YYYY-MM-DD format)
 *
 * @param date - Date to format (Date, DateTime, or ISO string)
 * @param userTimezone - IANA timezone identifier
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDate(date: Date | DateTime | string, userTimezone: string): string {
  let dt: DateTime;

  if (typeof date === 'string') {
    dt = parseDate(date, userTimezone);
  } else if (date instanceof Date) {
    dt = DateTime.fromJSDate(date, { zone: userTimezone });
  } else {
    dt = date.setZone(userTimezone);
  }

  return dt.toISODate() || ''; // YYYY-MM-DD
}

/**
 * Format datetime for API (ISO8601 format with timezone)
 *
 * @param date - Date to format
 * @param userTimezone - IANA timezone identifier
 * @returns ISO8601 datetime string
 */
export function formatDateTime(date: Date | DateTime | string, userTimezone: string): string {
  let dt: DateTime;

  if (typeof date === 'string') {
    dt = parseDate(date, userTimezone);
  } else if (date instanceof Date) {
    dt = DateTime.fromJSDate(date, { zone: userTimezone });
  } else {
    dt = date.setZone(userTimezone);
  }

  return dt.toISO() || ''; // ISO8601 with timezone
}

/**
 * Get current date in user's timezone (YYYY-MM-DD)
 *
 * @param userTimezone - IANA timezone identifier
 * @returns Current date string
 */
export function getCurrentDate(userTimezone: string): string {
  return DateTime.now().setZone(userTimezone).toISODate() || '';
}

/**
 * Get current datetime in user's timezone (ISO8601)
 *
 * @param userTimezone - IANA timezone identifier
 * @returns Current datetime string
 */
export function getCurrentDateTime(userTimezone: string): string {
  return DateTime.now().setZone(userTimezone).toISO() || '';
}

/**
 * Check if date is in the past (compared to user's current date)
 * Used for FR-010 past date warning
 *
 * @param dateString - Date to check (YYYY-MM-DD)
 * @param userTimezone - IANA timezone identifier
 * @returns True if date is before today in user's timezone
 */
export function isPastDate(dateString: string, userTimezone: string): boolean {
  const inputDate = parseDate(dateString, userTimezone);
  const today = DateTime.now().setZone(userTimezone).startOf('day');

  return inputDate < today;
}

/**
 * Check if date is today in user's timezone
 *
 * @param dateString - Date to check
 * @param userTimezone - IANA timezone identifier
 * @returns True if date is today
 */
export function isToday(dateString: string, userTimezone: string): boolean {
  const inputDate = parseDate(dateString, userTimezone);
  const today = DateTime.now().setZone(userTimezone);

  return inputDate.hasSame(today, 'day');
}

/**
 * Get date N days from now in user's timezone
 *
 * @param days - Number of days to add (negative for past)
 * @param userTimezone - IANA timezone identifier
 * @returns Date string (YYYY-MM-DD)
 */
export function getDateOffset(days: number, userTimezone: string): string {
  return DateTime.now()
    .setZone(userTimezone)
    .plus({ days })
    .toISODate() || '';
}

/**
 * Get start of week for a date in user's timezone
 *
 * @param dateString - Date string
 * @param userTimezone - IANA timezone identifier
 * @returns Start of week date (YYYY-MM-DD)
 */
export function getStartOfWeek(dateString: string, userTimezone: string): string {
  return parseDate(dateString, userTimezone)
    .startOf('week')
    .toISODate() || '';
}

/**
 * Get end of week for a date in user's timezone
 *
 * @param dateString - Date string
 * @param userTimezone - IANA timezone identifier
 * @returns End of week date (YYYY-MM-DD)
 */
export function getEndOfWeek(dateString: string, userTimezone: string): string {
  return parseDate(dateString, userTimezone)
    .endOf('week')
    .toISODate() || '';
}

/**
 * Validate date format (YYYY-MM-DD)
 *
 * @param dateString - Date string to validate
 * @returns True if valid date format
 */
export function isValidDateFormat(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const dt = DateTime.fromISO(dateString);
  return dt.isValid;
}

/**
 * Validate datetime format (ISO8601)
 *
 * @param datetimeString - Datetime string to validate
 * @returns True if valid datetime format
 */
export function isValidDateTimeFormat(datetimeString: string): boolean {
  const dt = DateTime.fromISO(datetimeString);
  return dt.isValid;
}

/**
 * Validate IANA timezone identifier
 *
 * @param timezone - Timezone string to validate
 * @returns True if valid timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    DateTime.now().setZone(timezone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get date range for queries (e.g., "last week", "this month")
 *
 * @param range - Range identifier
 * @param userTimezone - IANA timezone identifier
 * @returns Object with startDate and endDate
 */
export function getDateRange(
  range: 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month',
  userTimezone: string
): { startDate: string; endDate: string } {
  const now = DateTime.now().setZone(userTimezone);

  switch (range) {
    case 'today':
      return {
        startDate: now.toISODate() || '',
        endDate: now.toISODate() || ''
      };

    case 'yesterday':
      const yesterday = now.minus({ days: 1 });
      return {
        startDate: yesterday.toISODate() || '',
        endDate: yesterday.toISODate() || ''
      };

    case 'this-week':
      return {
        startDate: now.startOf('week').toISODate() || '',
        endDate: now.endOf('week').toISODate() || ''
      };

    case 'last-week':
      const lastWeek = now.minus({ weeks: 1 });
      return {
        startDate: lastWeek.startOf('week').toISODate() || '',
        endDate: lastWeek.endOf('week').toISODate() || ''
      };

    case 'this-month':
      return {
        startDate: now.startOf('month').toISODate() || '',
        endDate: now.endOf('month').toISODate() || ''
      };

    case 'last-month':
      const lastMonth = now.minus({ months: 1 });
      return {
        startDate: lastMonth.startOf('month').toISODate() || '',
        endDate: lastMonth.endOf('month').toISODate() || ''
      };

    default:
      return {
        startDate: now.toISODate() || '',
        endDate: now.toISODate() || ''
      };
  }
}

/**
 * Validate date range (start <= end, reasonable range)
 * FR-046: Ensure start date is before/equal to end date, max 1 year range
 *
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param userTimezone - IANA timezone identifier
 * @returns Validation result with error message
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  userTimezone: string
): { valid: boolean; error?: string } {
  const start = parseDate(startDate, userTimezone);
  const end = parseDate(endDate, userTimezone);

  if (!start.isValid) {
    return { valid: false, error: `Invalid start date: ${startDate}` };
  }

  if (!end.isValid) {
    return { valid: false, error: `Invalid end date: ${endDate}` };
  }

  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }

  // Check maximum range (1 year = 365 days)
  const daysDiff = end.diff(start, 'days').days;
  if (daysDiff > 365) {
    return { valid: false, error: 'Date range cannot exceed 1 year (365 days)' };
  }

  return { valid: true };
}
