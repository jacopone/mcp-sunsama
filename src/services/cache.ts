import { LRUCache } from 'lru-cache';
import { CacheConfig, CacheKeys } from '../config/cache-config.js';

/**
 * Cache entry wrapper with TTL metadata
 */
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

/**
 * LRU cache service with 30-second TTL for task data
 * Implements aggressive caching strategy for personal use optimization
 */
class CacheService {
  private cache: LRUCache<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new LRUCache({
      max: CacheConfig.MAX_ENTRIES,
      // Custom TTL per entry (set at insertion time)
      ttl: CacheConfig.TASK_TTL,
      // Update age on access
      updateAgeOnGet: false,
      // Allow stale entries briefly during refresh
      allowStale: false
    });
  }

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    return entry.data;
  }

  /**
   * Set value with custom TTL
   */
  set<T>(key: string, value: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      cachedAt: Date.now()
    };

    this.cache.set(key, entry as CacheEntry<unknown>, { ttl });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries matching a prefix
   */
  clearByPrefix(prefix: string): number {
    let cleared = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CacheConfig.MAX_ENTRIES
    };
  }

  // Task-specific cache helpers (T008: cache invalidation helpers)

  /**
   * Clear cache for a specific task
   */
  clearTaskCache(taskId: string): void {
    this.delete(`${CacheKeys.TASK_BY_ID}${taskId}`);
  }

  /**
   * Clear cache for all tasks on a specific day
   */
  clearDayCache(date: string): void {
    this.delete(`${CacheKeys.TASKS_BY_DAY}${date}`);
  }

  /**
   * Clear backlog cache
   */
  clearBacklogCache(): void {
    this.delete(CacheKeys.TASKS_BACKLOG);
  }

  /**
   * Clear archived tasks cache (optionally for specific date range)
   */
  clearArchiveCache(datePrefix?: string): void {
    if (datePrefix) {
      this.clearByPrefix(`${CacheKeys.TASKS_ARCHIVED}${datePrefix}`);
    } else {
      this.clearByPrefix(CacheKeys.TASKS_ARCHIVED);
    }
  }

  /**
   * Clear user cache
   */
  clearUserCache(): void {
    this.delete(CacheKeys.USER);
  }

  /**
   * Clear streams/channels cache
   */
  clearStreamsCache(): void {
    this.delete(CacheKeys.STREAMS);
  }

  /**
   * Invalidate all task-related caches (called on task mutations)
   */
  invalidateAllTaskCaches(): void {
    this.clearByPrefix(CacheKeys.TASK_BY_ID);
    this.clearByPrefix(CacheKeys.TASKS_BY_DAY);
    this.clearBacklogCache();
    this.clearByPrefix(CacheKeys.TASKS_ARCHIVED);
  }
}

// Singleton instance for global access
export const cache = new CacheService();

// Export class for testing
export { CacheService };
