/**
 * Enhanced Cache with single-flight, scoped keys, and advanced patterns
 */
import { EnterpriseCache, CacheOptions } from '../EnterpriseCache';

export interface SingleFlightOptions extends CacheOptions {
  scope?: 'public' | 'user' | 'tenant';
  userId?: string;
  tenantId?: string;
}

export class EnhancedCache extends EnterpriseCache {
  private inflightRequests = new Map<string, Promise<any>>();

  /**
   * Single-flight cache to prevent stampedes
   */
  async singleFlight<T>(
    key: string,
    producer: () => Promise<T>,
    options: SingleFlightOptions = {}
  ): Promise<T> {
    const scopedKey = this.getScopedKey(key, options);
    
    // Check cache first
    const cached = await this.get<T>(scopedKey);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already in flight
    const inflightKey = `inflight:${scopedKey}`;
    if (this.inflightRequests.has(inflightKey)) {
      return this.inflightRequests.get(inflightKey);
    }

    // Create and store the inflight promise
    const promise = this.executeProducer(producer, scopedKey, options);
    this.inflightRequests.set(inflightKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Always clean up the inflight request
      this.inflightRequests.delete(inflightKey);
    }
  }

  /**
   * Enhanced getOrSet with scoped keys
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: SingleFlightOptions = {}
  ): Promise<T> {
    return this.singleFlight(key, factory, options);
  }

  /**
   * Enhanced get with scoped keys
   */
  async get<T>(key: string, options: SingleFlightOptions = {}): Promise<T | null> {
    const scopedKey = this.getScopedKey(key, options);
    return super.get<T>(scopedKey);
  }

  /**
   * Enhanced set with scoped keys
   */
  async set<T>(key: string, value: T, options: SingleFlightOptions = {}): Promise<boolean> {
    const scopedKey = this.getScopedKey(key, options);
    return super.set(scopedKey, value, options);
  }

  /**
   * Concurrent tag invalidation
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const results = await Promise.all(
      tags.map(tag => this.invalidateByTag(tag))
    );
    return results.reduce((total, count) => total + count, 0);
  }

  /**
   * Stale-while-revalidate pattern
   */
  async staleWhileRevalidate<T>(
    key: string,
    producer: () => Promise<T>,
    options: SingleFlightOptions & { staleTime?: number } = {}
  ): Promise<T> {
    const scopedKey = this.getScopedKey(key, options);
    const staleTime = options.staleTime || 60000; // 1 minute default
    
    const entry = await super.get(scopedKey);
    
    if (entry && typeof entry === 'object' && 'created' in entry) {
      const age = Date.now() - (entry as any).created;
      
      if (age < (entry as any).ttl) {
        // Fresh data
        return entry as T;
      } else if (age < (entry as any).ttl + staleTime) {
        // Stale but acceptable, refresh in background
        this.refreshInBackground(scopedKey, producer, options);
        return entry as T;
      }
    }

    // No cache or too stale, fetch fresh
    return this.singleFlight(key, producer, options);
  }

  /**
   * Cache warming for popular keys
   */
  async warmCache<T>(
    keys: Array<{ key: string; producer: () => Promise<T>; options?: SingleFlightOptions }>
  ): Promise<void> {
    await Promise.allSettled(
      keys.map(({ key, producer, options }) => 
        this.singleFlight(key, producer, options || {})
      )
    );
  }

  /**
   * Get scoped cache key
   */
  private getScopedKey(key: string, options: SingleFlightOptions): string {
    const { scope = 'public', userId, tenantId } = options;
    
    switch (scope) {
      case 'user':
        return `u:${userId || 'anon'}:${key}`;
      case 'tenant':
        return `t:${tenantId || 'default'}:${key}`;
      case 'public':
      default:
        return `p:${key}`;
    }
  }

  /**
   * Execute producer and handle caching
   */
  private async executeProducer<T>(
    producer: () => Promise<T>,
    scopedKey: string,
    options: SingleFlightOptions
  ): Promise<T> {
    try {
      const result = await producer();
      
      // Cache the result
      await super.set(scopedKey, result, options);
      
      // Emit cache miss event
      this.emit({
        type: 'cache_miss',
        payload: { key: scopedKey, cached: true },
        context: this.createContext('cache', 'MISS'),
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this.emit({
        type: 'cache_error',
        payload: { key: scopedKey, error: (error as Error).message },
        context: this.createContext('cache', 'ERROR'),
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * Refresh cache in background
   */
  private refreshInBackground<T>(
    scopedKey: string,
    producer: () => Promise<T>,
    options: SingleFlightOptions
  ): void {
    // Don't await this - it's background work
    this.executeProducer(producer, scopedKey, options).catch(error => {
      // Log but don't throw - this is background refresh
      this.emit({
        type: 'background_refresh_failed',
        payload: { key: scopedKey, error: (error as Error).message },
        context: this.createContext('cache', 'REFRESH'),
        timestamp: Date.now()
      });
    });
  }

}

export const enhancedCache = new EnhancedCache();