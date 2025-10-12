/**
 * Cache TTL configuration
 * All values in milliseconds
 */
export const CacheConfig = {
  /** Task cache TTL: 30 seconds (aggressive for personal use) */
  TASK_TTL: 30_000,

  /** User profile cache TTL: 5 minutes (rarely changes) */
  USER_TTL: 300_000,

  /** Streams/channels cache TTL: 5 minutes (rarely changes) */
  STREAM_TTL: 300_000,

  /** Archived tasks cache TTL: 10 minutes (historical data, less critical freshness) */
  ARCHIVE_TTL: 600_000,

  /** Maximum cache entries (prevents unbounded growth) */
  MAX_ENTRIES: 1000
} as const;

/**
 * Cache key prefixes for namespace isolation
 */
export const CacheKeys = {
  TASK_BY_ID: 'task:',
  TASKS_BY_DAY: 'tasks:day:',
  TASKS_BACKLOG: 'tasks:backlog',
  TASKS_ARCHIVED: 'tasks:archived:',
  USER: 'user',
  STREAMS: 'streams'
} as const;
