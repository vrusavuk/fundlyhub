/**
 * Admin Cache Service
 * In-memory caching with TTL and pattern-based invalidation
 * Implements Interface Segregation - focused cache interface
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

export class AdminCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number = 300000; // 5 minutes default

  constructor(defaultTTL?: number) {
    this.cache = new Map();
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Get value from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await factory();
    this.set(key, data, options);
    
    return data;
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all keys matching pattern
   */
  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    const valid = entries.filter(([_, entry]) => {
      const age = now - entry.timestamp;
      return age <= entry.ttl;
    }).length;
    
    const expired = entries.length - valid;
    
    return {
      total: entries.length,
      valid,
      expired,
      size: entries.reduce((sum, [key]) => sum + key.length, 0)
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          this.cache.delete(key);
        }
      }
    });
  }
}
