/**
 * Refactored Enterprise Cache Service
 */
import { EnterpriseService } from './EnterpriseService';
import { RequestContext, ServiceResponse, HealthCheck } from './types';

export interface CacheEntry<T = any> {
  value: T;
  ttl: number;
  created: number;
  accessed: number;
  hits: number;
  tags?: string[];
  compressed?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage: number;
  keyCount: number;
  averageAccessTime: number;
}

export class EnterpriseCache extends EnterpriseService {
  private cache = new Map<string, CacheEntry>();
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccessTime: 0,
    accessCount: 0
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const context = this.createContext('cache', 'GET');
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry || this.isExpired(entry)) {
        this.recordMiss(context);
        if (entry) this.cache.delete(key);
        return null;
      }

      // Update access metrics
      entry.accessed = Date.now();
      entry.hits++;
      
      this.recordHit(context);
      return this.decompress(entry);
      
    } catch (error) {
      this.emit({
        type: 'error',
        payload: { operation: 'cache_get', key, error: (error as Error).message },
        context,
        timestamp: Date.now()
      });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const context = this.createContext('cache', 'SET');
    
    try {
      await this.ensureCapacity();

      const entry: CacheEntry<T> = {
        value: this.compress(value, options.compress),
        ttl: options.ttl || this.getDefaultTTL(),
        created: Date.now(),
        accessed: Date.now(),
        hits: 0,
        tags: options.tags,
        compressed: options.compress
      };

      this.cache.set(key, entry);
      
      this.emit({
        type: 'cache_set',
        payload: { key, ttl: entry.ttl, tags: options.tags },
        context,
        timestamp: Date.now()
      });

      return true;
      
    } catch (error) {
      this.emit({
        type: 'error',
        payload: { operation: 'cache_set', key, error: (error as Error).message },
        context,
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Get or set pattern with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.emit({
      type: 'cache_invalidate',
      payload: { strategy: 'tag', tag, count },
      context: this.createContext('cache', 'INVALIDATE'),
      timestamp: Date.now()
    });

    return count;
  }

  /**
   * Invalidate by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.emit({
      type: 'cache_invalidate',
      payload: { strategy: 'pattern', pattern, count },
      context: this.createContext('cache', 'INVALIDATE'),
      timestamp: Date.now()
    });

    return count;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
      evictions: this.metrics.evictions,
      memoryUsage: this.calculateMemoryUsage(),
      keyCount: this.cache.size,
      averageAccessTime: this.metrics.accessCount > 0 
        ? this.metrics.totalAccessTime / this.metrics.accessCount 
        : 0
    };
  }

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<HealthCheck> {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    
    const checks = {
      hitRate: metrics.hitRate >= 50,
      memoryUsage: metrics.memoryUsage < 90,
      accessTime: metrics.averageAccessTime < 100
    };

    if (!checks.hitRate) issues.push('Low cache hit rate');
    if (!checks.memoryUsage) issues.push('High memory usage');
    if (!checks.accessTime) issues.push('Slow cache access');

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : (issues.length > 1 ? 'unhealthy' : 'degraded'),
      checks,
      issues,
      timestamp: new Date().toISOString(),
      metrics
    };
  }

  /**
   * Private helper methods
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.created + entry.ttl;
  }

  private async ensureCapacity(): Promise<void> {
    const maxSize = this.getLimit('cacheSize');
    
    if (this.cache.size >= maxSize) {
      await this.evictLRU();
    }
  }

  private async evictLRU(): Promise<void> {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessed < oldestTime) {
        oldestTime = entry.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
      
      this.emit({
        type: 'cache_evict',
        payload: { key: oldestKey, reason: 'lru' },
        context: this.createContext('cache', 'EVICT'),
        timestamp: Date.now()
      });
    }
  }

  private recordHit(context: RequestContext): void {
    this.metrics.hits++;
    this.updateAccessMetrics(context);
  }

  private recordMiss(context: RequestContext): void {
    this.metrics.misses++;
    this.updateAccessMetrics(context);
  }

  private updateAccessMetrics(context: RequestContext): void {
    const accessTime = performance.now() - context.startTime;
    this.metrics.totalAccessTime += accessTime;
    this.metrics.accessCount++;
  }

  private compress<T>(value: T, shouldCompress?: boolean): T {
    if (!shouldCompress || !this.getFeatureFlag('caching')) {
      return value;
    }
    
    // Basic compression logic - in production use proper compression
    return value;
  }

  private decompress<T>(entry: CacheEntry<T>): T {
    if (!entry.compressed) {
      return entry.value;
    }
    
    // Decompression logic
    return entry.value;
  }

  private calculateMemoryUsage(): number {
    return (this.cache.size / this.getLimit('cacheSize')) * 100;
  }

  private getDefaultTTL(): number {
    return 300000; // 5 minutes
  }
}

export const enterpriseCache = new EnterpriseCache();