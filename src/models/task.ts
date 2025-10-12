import { z } from 'zod';
import type { Task as SunsamaTask } from 'sunsama-api/types';

/**
 * Re-export the Sunsama Task type as our primary Task type
 * This ensures type compatibility with the API responses
 */
export type Task = SunsamaTask;

/**
 * Task Entity Schema (for runtime validation)
 *
 * Validates critical fields from Sunsama API responses.
 * Uses z.any() for complex nested objects since we're just passing them through.
 *
 * Note: The schema is intentionally relaxed to accommodate API changes.
 * Constitution Principle III: Resilient Error Handling means graceful degradation.
 */
export const TaskSchema = z.object({
  // Core ID fields
  _id: z.string(),
  text: z.string(),

  // Common fields we interact with
  completed: z.boolean(),
  notes: z.string(),

  // Allow any other fields (API has 40+ fields)
}).passthrough();

/**
 * Helper function to extract scheduled date from task
 * Sunsama stores scheduled date in task.snooze.date
 */
export function getTaskScheduledDate(task: Task): string | null {
  return task.snooze?.date || null;
}

/**
 * Partial Task Update Schema
 *
 * Allows updating subset of task fields without requiring all fields.
 */
export const TaskUpdateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  notes: z.string().max(10000).optional(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  plannedTime: z.number()
    .int()
    .min(0)
    .max(1440)
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  snoozedUntil: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  streamId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

/**
 * Create Task Request Schema
 */
export const TaskCreateSchema = z.object({
  text: z.string().min(1).max(500),
  notes: z.string().max(10000).optional(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  plannedTime: z.number().int().min(0).max(1440).optional(),
  streamId: z.string().uuid().optional(),
});

export type TaskCreate = z.infer<typeof TaskCreateSchema>;

/**
 * Time Estimate Value Object
 */
export const TimeEstimateSchema = z.object({
  minutes: z.number()
    .int('Minutes must be integer')
    .min(0, 'Minutes cannot be negative')
    .max(1440, 'Cannot exceed 24 hours (1440 minutes)'),
});

export type TimeEstimate = z.infer<typeof TimeEstimateSchema>;
