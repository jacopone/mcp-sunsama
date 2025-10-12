/**
 * Task tool helpers - integrate cache, validation, timezone, and error handling
 * Phase 3: User Story 1 - Daily Planning Workflow
 */

import { cache } from '../services/cache.js';
import { CacheConfig, CacheKeys } from '../config/cache-config.js';
import {
  validateTaskResponse,
  validateTaskArrayResponse,
  validateUserResponse,
  logValidationError,
  type ValidationResult
} from '../services/schema-validator.js';
import {
  isPastDate,
  getCurrentDate,
  formatDate,
  parseDate
} from '../utils/date-utils.js';
import type { Task } from '../models/task.js';
import { getTaskScheduledDate } from '../models/task.js';
import type { User } from '../models/user.js';
import type { ToolContext } from './shared.js';

/**
 * Get user with caching (5min TTL)
 * T027: User tool with cache integration
 */
export async function getCachedUser(context: ToolContext): Promise<User> {
  const cacheKey = CacheKeys.USER;

  // Try cache first
  const cached = cache.get<User>(cacheKey);
  if (cached) {
    console.error('[TaskHelpers] User cache HIT');
    return cached;
  }

  console.error('[TaskHelpers] User cache MISS - fetching from API');

  // Fetch from API
  const userData = await context.client.getUser();

  // Validate response
  const validation = validateUserResponse(userData);
  if (!validation.success) {
    logValidationError('GET /user', userData, validation.errors || []);
    throw new Error(`User schema validation failed: ${validation.errors?.join(', ')}`);
  }

  // Cache for 5 minutes
  cache.set(cacheKey, validation.data!, CacheConfig.USER_TTL);

  return validation.data!;
}

/**
 * Get user timezone (cached)
 * T028: Timezone integration
 */
export async function getUserTimezone(context: ToolContext): Promise<string> {
  const user = await getCachedUser(context);
  return user.timezone;
}

/**
 * Get tasks by day with caching (30s TTL)
 * T020: get-tasks-by-day with cache integration
 */
export async function getCachedTasksByDay(
  date: string,
  timezone: string,
  context: ToolContext
): Promise<Task[]> {
  const cacheKey = `${CacheKeys.TASKS_BY_DAY}${date}`;

  // Try cache first
  const cached = cache.get<Task[]>(cacheKey);
  if (cached) {
    console.error(`[TaskHelpers] Tasks by day cache HIT: ${date}`);
    return cached;
  }

  console.error(`[TaskHelpers] Tasks by day cache MISS: ${date} - fetching from API`);

  // Fetch from API
  const tasksData = await context.client.getTasksByDay(date, timezone);

  // Validate response
  const validation = validateTaskArrayResponse(tasksData);
  if (!validation.success) {
    logValidationError(`GET /tasks?date=${date}`, tasksData, validation.errors || []);
    throw new Error(`Tasks schema validation failed: ${validation.errors?.join(', ')}`);
  }

  // Cache for 30 seconds
  cache.set(cacheKey, validation.data!, CacheConfig.TASK_TTL);

  return validation.data!;
}

/**
 * Get task by ID with caching (30s TTL)
 * T021: get-task-by-id with cache integration
 */
export async function getCachedTaskById(
  taskId: string,
  context: ToolContext
): Promise<Task | null> {
  const cacheKey = `${CacheKeys.TASK_BY_ID}${taskId}`;

  // Try cache first
  const cached = cache.get<Task>(cacheKey);
  if (cached) {
    console.error(`[TaskHelpers] Task by ID cache HIT: ${taskId}`);
    return cached;
  }

  console.error(`[TaskHelpers] Task by ID cache MISS: ${taskId} - fetching from API`);

  // Fetch from API
  const taskData = await context.client.getTaskById(taskId);
  if (!taskData) {
    return null;
  }

  // Validate response
  const validation = validateTaskResponse(taskData);
  if (!validation.success) {
    logValidationError(`GET /tasks/${taskId}`, taskData, validation.errors || []);
    throw new Error(`Task schema validation failed: ${validation.errors?.join(', ')}`);
  }

  // Cache for 30 seconds
  cache.set(cacheKey, validation.data!, CacheConfig.TASK_TTL);

  return validation.data!;
}

/**
 * Get backlog tasks with caching (30s TTL)
 * T029: get-tasks-backlog with cache integration
 */
export async function getCachedTasksBacklog(
  context: ToolContext
): Promise<Task[]> {
  const cacheKey = CacheKeys.TASKS_BACKLOG;

  // Try cache first
  const cached = cache.get<Task[]>(cacheKey);
  if (cached) {
    console.error('[TaskHelpers] Backlog cache HIT');
    return cached;
  }

  console.error('[TaskHelpers] Backlog cache MISS - fetching from API');

  // Fetch from API
  const tasksData = await context.client.getTasksBacklog();

  // Validate response
  const validation = validateTaskArrayResponse(tasksData);
  if (!validation.success) {
    logValidationError('GET /tasks/backlog', tasksData, validation.errors || []);
    throw new Error(`Tasks schema validation failed: ${validation.errors?.join(', ')}`);
  }

  // Cache for 30 seconds
  cache.set(cacheKey, validation.data!, CacheConfig.TASK_TTL);

  return validation.data!;
}

/**
 * Check if date is in the past and return warning message
 * FR-010: Past date warning
 */
export function checkPastDateWarning(
  date: string,
  userTimezone: string
): string | null {
  if (isPastDate(date, userTimezone)) {
    return `⚠️ Warning: Creating task for past date: ${date}`;
  }
  return null;
}

/**
 * Invalidate caches after task mutation
 * Used by create, update, delete operations
 */
export function invalidateTaskCaches(taskId: string, scheduledDate?: string | null): void {
  // Invalidate specific task cache
  cache.clearTaskCache(taskId);

  // Invalidate day cache if task has a scheduled date
  if (scheduledDate) {
    cache.clearDayCache(scheduledDate);
  }

  // Invalidate backlog cache (task might move to/from backlog)
  cache.clearBacklogCache();

  console.error(`[TaskHelpers] Invalidated caches for task ${taskId}`);
}

/**
 * Invalidate day caches when rescheduling
 * Used by reschedule operations
 */
export function invalidateDayCaches(oldDate: string | null, newDate: string | null): void {
  if (oldDate) {
    cache.clearDayCache(oldDate);
  }
  if (newDate) {
    cache.clearDayCache(newDate);
  }
  cache.clearBacklogCache(); // Task might move to/from backlog

  console.error(`[TaskHelpers] Invalidated day caches: ${oldDate} → ${newDate}`);
}

/**
 * Validate task text length
 * FR-015: Task text validation (1-500 chars)
 */
export function validateTaskText(text: string): { valid: boolean; error?: string } {
  if (text.length < 1) {
    return { valid: false, error: 'Task text must be at least 1 character' };
  }
  if (text.length > 500) {
    return { valid: false, error: 'Task text must be 500 characters or less' };
  }
  return { valid: true };
}

/**
 * Validate time estimate
 * FR-017: Time estimate validation (0-1440 minutes)
 */
export function validateTimeEstimate(minutes: number): { valid: boolean; error?: string } {
  if (minutes < 0) {
    return { valid: false, error: 'Time estimate cannot be negative' };
  }
  if (minutes > 1440) {
    return { valid: false, error: 'Time estimate cannot exceed 24 hours (1440 minutes)' };
  }
  return { valid: true };
}

/**
 * Format task response with warnings
 */
export interface TaskOperationResponse {
  success: boolean;
  taskId?: string;
  warning?: string;
  [key: string]: any;
}

export function formatTaskResponse(
  response: any,
  warning?: string | null
): TaskOperationResponse {
  const result: TaskOperationResponse = {
    success: response.success || true,
    ...response
  };

  if (warning) {
    result.warning = warning;
  }

  return result;
}
