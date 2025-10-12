import { z } from 'zod';

/**
 * Task Entity Schema
 *
 * Represents a work item with scheduling, completion tracking,
 * and organizational properties.
 */
export const TaskSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
  text: z.string()
    .min(1, 'Task text required')
    .max(500, 'Task text too long (max 500 characters)'),
  notes: z.string()
    .max(10000, 'Notes too long (max 10000 characters)')
    .optional()
    .nullable(),
  scheduledDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  plannedTime: z.number()
    .int('Planned time must be integer minutes')
    .min(0, 'Planned time cannot be negative')
    .max(1440, 'Planned time cannot exceed 24 hours')
    .optional()
    .nullable(),
  actualTime: z.number()
    .int('Actual time must be integer minutes')
    .min(0, 'Actual time cannot be negative')
    .optional()
    .nullable(),
  completed: z.boolean().default(false),
  completedAt: z.string()
    .datetime('Invalid datetime format')
    .optional()
    .nullable(),
  snoozedUntil: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  streamId: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archived: z.boolean().default(false),
}).refine(
  (data) => {
    // If completed, completedAt must be set
    if (data.completed && !data.completedAt) {
      return false;
    }
    return true;
  },
  { message: 'Completed tasks must have completedAt timestamp' }
).refine(
  (data) => {
    // Due date must be >= scheduled date if both present
    if (data.scheduledDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.scheduledDate);
    }
    return true;
  },
  { message: 'Due date must be on or after scheduled date' }
);

export type Task = z.infer<typeof TaskSchema>;

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
