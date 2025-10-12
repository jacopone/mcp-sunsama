import {
  isRetryableError,
  TimeoutError,
  SunsamaAPIError,
  getActionableErrorMessage
} from './errors.js';

/**
 * Retry configuration for exponential backoff
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (2 = exponential doubling) */
  backoffMultiplier: number;
  /** Timeout per attempt in milliseconds */
  timeoutMs?: number;
}

/**
 * Default retry configuration
 * Constitution Principle III: Resilient Error Handling
 * - Max 3 attempts
 * - Exponential backoff: 100ms → 200ms → 400ms
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  timeoutMs: 30000 // 30 second timeout per request
};

/**
 * Retry result with attempt metadata
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Execute function with exponential backoff retry
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Retry result with data or error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      // Apply timeout if configured
      if (finalConfig.timeoutMs) {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new TimeoutError(
                `Request timed out after ${finalConfig.timeoutMs!}ms`,
                finalConfig.timeoutMs!
              )),
              finalConfig.timeoutMs!
            )
          )
        ]);
        return result;
      } else {
        return await fn();
      }
    } catch (error) {
      lastError = error;

      // Log attempt failure
      console.error(`[Retry] Attempt ${attempt}/${finalConfig.maxAttempts} failed:`, getActionableErrorMessage(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error('[Retry] Error is not retryable, aborting');
        throw error;
      }

      // Don't delay after last attempt
      if (attempt >= finalConfig.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelayMs
      );

      console.error(`[Retry] Waiting ${delayMs}ms before attempt ${attempt + 1}`);
      await delay(delayMs);
      totalDelayMs += delayMs;
    }
  }

  // All attempts failed
  console.error(`[Retry] All ${finalConfig.maxAttempts} attempts failed. Total delay: ${totalDelayMs}ms`);
  throw lastError;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap HTTP fetch with retry logic
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    // Check for HTTP errors
    if (!response.ok) {
      throw new SunsamaAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        {
          url,
          method: options.method || 'GET',
          body: await response.text().catch(() => 'Unable to read response body')
        }
      );
    }

    return response;
  }, config);
}

/**
 * Parse JSON with error handling
 */
export async function parseJsonSafely<T>(response: Response): Promise<T> {
  try {
    const json = await response.json();
    return json as T;
  } catch (error) {
    throw new SunsamaAPIError(
      'Failed to parse JSON response',
      response.status,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Log retry statistics for monitoring
 */
export function logRetryStats(
  operation: string,
  attempts: number,
  totalDelayMs: number,
  success: boolean
): void {
  const status = success ? 'SUCCESS' : 'FAILURE';
  console.error(`[Retry Stats] ${operation}: ${status} after ${attempts} attempts (${totalDelayMs}ms total delay)`);
}
