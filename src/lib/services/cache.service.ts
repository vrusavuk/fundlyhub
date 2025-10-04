/**
 * Unified Cache Service
 * Single source of truth for all caching needs
 * Uses EnhancedCache as the underlying implementation
 */

import { EnhancedCache } from '@/lib/enterprise/utils/EnhancedCache';

/**
 * Cache Service
 * Provides a simplified interface for caching with consistent TTL and scoping
 */
export class CacheService {
  private cache: EnhancedCache;

  constructor() {
    // EnhancedCache extends EnterpriseCache which accepts ServiceConfig
    this.cache = new EnhancedCache({
      limits: {
        requestSize: 10485760, // 10MB
        cacheSize: 10000,
        rateLimitWindow: 60000, // 1 minute
        rateLimitRequests: 100,
        maxRetries: 3,
        requestTimeout: 30000, // 30 seconds
        idempotencyTtl: 86400000 // 24 hours
      }
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
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
      compress?: boolean;
    }
  ): Promise<boolean> {
    return this.cache.set(key, value, options);
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
      compress?: boolean;
    }
  ): Promise<T> {
    return this.cache.getOrSet(key, factory, options);
  }

  /**
   * Single-flight request (prevents duplicate concurrent requests)
   */
  async singleFlight<T>(
    key: string,
    producer: () => Promise<T>,
    options?: {
      ttl?: number;
      userId?: string;
      tenantId?: string;
    }
  ): Promise<T> {
    return this.cache.singleFlight(key, producer, options);
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
      userId?: string;
      tenantId?: string;
    }
  ): Promise<T> {
    return this.cache.staleWhileRevalidate(key, producer, options);
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    return this.cache.invalidateByTag(tag);
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    return this.cache.invalidateByPattern(pattern);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear all entries by invalidating with wildcard pattern
    await this.cache.invalidateByPattern('*');
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.cache.healthCheck();
  }
}

// Export singleton instance
export const cacheService = new CacheService();
