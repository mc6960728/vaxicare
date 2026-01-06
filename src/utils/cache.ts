/**
 * Simple in-memory cache for static data
 * Reduces database queries for data that rarely changes
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete entries matching a prefix
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttlMs);
    return data;
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// Cache keys constants
export const CACHE_KEYS = {
  VACCINE_SCHEDULES: 'vaccine_schedules',
  VACCINES: 'vaccines',
  VACCINATION_CENTERS: 'vaccination_centers',
  DISTRICTS: 'districts',
  HEALTH_RATIO: 'health_ratio',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  VACCINE_SCHEDULES: 30 * 60 * 1000,    // 30 minutes (rarely changes)
  VACCINES: 15 * 60 * 1000,              // 15 minutes
  VACCINATION_CENTERS: 10 * 60 * 1000,   // 10 minutes
  DISTRICTS: 60 * 60 * 1000,             // 1 hour (geographic data)
  HEALTH_RATIO: 5 * 60 * 1000,           // 5 minutes (aggregated stats)
} as const;
