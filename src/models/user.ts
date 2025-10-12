import { z } from 'zod';

/**
 * User Entity Schema
 *
 * Represents authenticated Sunsama user with profile and settings.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email format'),
  name: z.string().optional().nullable(),
  timezone: z.string().refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid IANA timezone' }
  ),
  groups: z.array(z.string()).optional().default([]),
  workspaceId: z.string().optional().nullable(),
  settings: z.record(z.unknown()).optional().default({}),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
