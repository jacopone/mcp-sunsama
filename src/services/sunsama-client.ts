// Type will be resolved at runtime via sunsama-api package
type SunsamaClient = any;
import { withRetry, fetchWithRetry } from '../utils/error-handler.js';
import { SunsamaAPIError, AuthenticationError } from '../utils/errors.js';

/**
 * Wrapper for Sunsama API client with retry logic and error handling
 * Constitution Principle III: Resilient Error Handling
 */

/**
 * Wrap Sunsama client method with retry logic
 *
 * @param client - SunsamaClient instance
 * @param methodName - Method name for logging
 * @param fn - Async function to execute
 * @returns Result with retry handling
 */
export async function withClientRetry<T>(
  client: SunsamaClient,
  methodName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await withRetry(
      async () => {
        console.error(`[SunsamaClient] Calling ${methodName}`);
        return await fn();
      },
      {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 400,
        backoffMultiplier: 2
      }
    );
  } catch (error) {
    console.error(`[SunsamaClient] ${methodName} failed after retries:`, error);
    throw error;
  }
}

/**
 * Wrapped Sunsama client operations
 * Each method wraps the underlying sunsama-api call with retry logic
 */
export class ResilientSunsamaClient {
  constructor(private client: SunsamaClient) {}

  /**
   * Get tasks for a specific day
   */
  async getTasksByDay(date: string) {
    return withClientRetry(
      this.client,
      'getTasksByDay',
      async () => this.client.getTasksByDay(date)
    );
  }

  /**
   * Get backlog tasks
   */
  async getBacklogTasks() {
    return withClientRetry(
      this.client,
      'getBacklogTasks',
      async () => this.client.getBacklogTasks()
    );
  }

  /**
   * Get archived tasks
   */
  async getArchivedTasks(startDate?: string, endDate?: string) {
    return withClientRetry(
      this.client,
      'getArchivedTasks',
      async () => this.client.getArchivedTasks(startDate, endDate)
    );
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string) {
    return withClientRetry(
      this.client,
      'getTaskById',
      async () => this.client.getTaskById(taskId)
    );
  }

  /**
   * Create new task
   */
  async createTask(taskData: any) {
    return withClientRetry(
      this.client,
      'createTask',
      async () => this.client.createTask(taskData)
    );
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: any) {
    return withClientRetry(
      this.client,
      'updateTask',
      async () => this.client.updateTask(taskId, updates)
    );
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string) {
    return withClientRetry(
      this.client,
      'deleteTask',
      async () => this.client.deleteTask(taskId)
    );
  }

  /**
   * Get user profile
   */
  async getUser() {
    return withClientRetry(
      this.client,
      'getUser',
      async () => this.client.getUser()
    );
  }

  /**
   * Get streams/channels
   */
  async getStreams() {
    return withClientRetry(
      this.client,
      'getStreams',
      async () => this.client.getStreams()
    );
  }

  /**
   * Get underlying client (for methods not yet wrapped)
   */
  getClient(): SunsamaClient {
    return this.client;
  }
}

/**
 * Create resilient client from base client
 */
export function createResilientClient(client: SunsamaClient): ResilientSunsamaClient {
  return new ResilientSunsamaClient(client);
}
