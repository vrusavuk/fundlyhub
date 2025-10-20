/**
 * Unified Cache Service
 * Single source of truth for all caching needs
 * In-memory LRU cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
  tags: string[];
  hits: number;
  lastAccess: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  evictions: number;
}

/**
 * Cache Service with LRU eviction and TTL
 */
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 10000;
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  
  // Single-flight tracking to prevent duplicate requests
  private inflightRequests = new Map<string, Promise<any>>();

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update access tracking
    entry.hits++;
    entry.lastAccess = Date.now();
    this.metrics.hits++;
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
    }
  ): Promise<boolean> {
    const ttl = options?.ttl || 300000; // 5 minutes default
    const tags = options?.tags || [];

    // Ensure capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      tags,
      hits: 0,
      lastAccess: Date.now(),
    });

    return true;
  }

  /**
   * Get or set with factory function (prevents cache stampede)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
    }
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Use single-flight to prevent duplicate requests
    return this.singleFlight(key, async () => {
      const value = await factory();
      await this.set(key, value, options);
      return value;
    });
  }

  /**
   * Single-flight request (prevents duplicate concurrent requests)
   */
  async singleFlight<T>(
    key: string,
    producer: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in flight
    const inflight = this.inflightRequests.get(key);
    if (inflight) {
      return inflight as Promise<T>;
    }

    // Execute the producer
    const promise = producer()
      .finally(() => {
        // Clean up inflight tracking
        this.inflightRequests.delete(key);
      });

    this.inflightRequests.set(key, promise);
    return promise;
  }

  /**
   * Stale-while-revalidate pattern
   * Returns stale data immediately while refreshing in background
   */
  async staleWhileRevalidate<T>(
    key: string,
    producer: () => Promise<T>,
    options?: {
      ttl?: number;
      staleTime?: number;
    }
  ): Promise<T> {
    const cached = await this.get<T>(key);
    const ttl = options?.ttl || 300000;
    const staleTime = options?.staleTime || 60000;

    if (cached !== null) {
      // Check if data is stale
      const entry = this.cache.get(key);
      if (entry && Date.now() > entry.expiry - staleTime) {
        // Data is stale, refresh in background
        this.singleFlight(key, async () => {
          const fresh = await producer();
          await this.set(key, fresh, { ttl, tags: entry.tags });
          return fresh;
        }).catch(console.error);
      }
      
      return cached;
    }

    // No cached data, fetch fresh
    return this.getOrSet(key, producer, { ttl });
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.inflightRequests.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
      size: this.cache.size,
      evictions: this.metrics.evictions,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const metrics = this.getMetrics();
    const healthy = metrics.size < this.maxSize * 0.9 && metrics.hitRate > 0.5;
    
    return {
      status: healthy ? 'healthy' : 'degraded',
      metrics,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
