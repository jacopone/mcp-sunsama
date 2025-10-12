/**
 * Custom error classes for Sunsama MCP server
 * Maps to MCP standard error codes
 */

/**
 * Base error class for all Sunsama-related errors
 */
export class SunsamaError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SunsamaError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API error (HTTP errors, network failures)
 * MCP error code: -32603 (Internal error)
 */
export class SunsamaAPIError extends SunsamaError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    details?: unknown
  ) {
    super(message, -32603, details);
    this.name = 'SunsamaAPIError';
  }
}

/**
 * Validation error (schema validation failures)
 * MCP error code: -32602 (Invalid params)
 */
export class ValidationError extends SunsamaError {
  constructor(
    message: string,
    public readonly validationErrors?: string[]
  ) {
    super(message, -32602, { validationErrors });
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (login failures, expired tokens)
 * MCP error code: -32001 (Custom: Authentication failed)
 */
export class AuthenticationError extends SunsamaError {
  constructor(message: string, details?: unknown) {
    super(message, -32001, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limit error (too many requests)
 * MCP error code: -32002 (Custom: Rate limited)
 */
export class RateLimitError extends SunsamaError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, -32002, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Not found error (task/resource not found)
 * MCP error code: -32001 (Custom: Not found)
 */
export class NotFoundError extends SunsamaError {
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message, -32001, { resourceType, resourceId });
    this.name = 'NotFoundError';
  }
}

/**
 * Schema change detected error (API response doesn't match expected schema)
 * MCP error code: -32603 (Internal error)
 */
export class SchemaChangeError extends SunsamaError {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly validationErrors: string[]
  ) {
    super(message, -32603, { endpoint, validationErrors });
    this.name = 'SchemaChangeError';
  }
}

/**
 * Timeout error (request exceeded timeout)
 * MCP error code: -32603 (Internal error)
 */
export class TimeoutError extends SunsamaError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message, -32603, { timeoutMs });
    this.name = 'TimeoutError';
  }
}

/**
 * Check if error is retryable (transient failures)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof SunsamaAPIError) {
    // Retry on 5xx errors and specific 4xx errors
    if (!error.statusCode) return true; // Network errors
    return error.statusCode >= 500 || error.statusCode === 429 || error.statusCode === 408;
  }

  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof RateLimitError) {
    return true;
  }

  return false;
}

/**
 * Convert error to actionable user message
 */
export function getActionableErrorMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Sunsama authentication failed. Please check your SUNSAMA_EMAIL and SUNSAMA_PASSWORD environment variables.';
  }

  if (error instanceof ValidationError) {
    const errors = error.validationErrors?.join(', ') || 'Unknown validation error';
    return `Invalid task data: ${errors}. Please check your input and try again.`;
  }

  if (error instanceof NotFoundError) {
    return `${error.resourceType} not found (ID: ${error.resourceId}). It may have been deleted or you may not have access.`;
  }

  if (error instanceof RateLimitError) {
    const retryAfter = error.retryAfter ? ` Try again in ${error.retryAfter} seconds.` : '';
    return `Sunsama API rate limit exceeded.${retryAfter}`;
  }

  if (error instanceof SchemaChangeError) {
    return `Sunsama API schema changed for endpoint ${error.endpoint}. This may indicate a Sunsama update. Please report this issue.`;
  }

  if (error instanceof TimeoutError) {
    return `Request timed out after ${error.timeoutMs}ms. Please check your network connection and try again.`;
  }

  if (error instanceof SunsamaAPIError) {
    return `Sunsama API error (${error.statusCode || 'unknown'}): ${error.message}`;
  }

  if (error instanceof Error) {
    return `Unexpected error: ${error.message}`;
  }

  return 'An unknown error occurred. Please try again.';
}
