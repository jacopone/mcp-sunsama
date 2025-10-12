import { z } from 'zod';

/**
 * Channel/Stream Entity Schema
 *
 * Organizational container for grouping tasks by project or context.
 */
export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(1, 'Channel name required')
    .max(100, 'Channel name too long (max 100 characters)'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format (#RRGGBB)')
    .optional()
    .nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().int().min(0).optional().default(0),
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type Channel = z.infer<typeof ChannelSchema>;

/**
 * Stream is an alias for Channel (Sunsama uses both terms)
 */
export const StreamSchema = ChannelSchema;
export type Stream = Channel;
