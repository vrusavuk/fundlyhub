/**
 * Unified API Service - Single source of truth for all API operations
 * Consolidates retry logic, caching, security, validation, and monitoring
 * 
 * This service replaces:
 * - api.service.ts
 * - EnhancedApiService.ts
 * - IntegratedApiService.ts
 * 
 * Benefits:
 * - Single place for all API logic
 * - Consistent error handling and retry mechanisms
 * - Unified caching strategy
 * - Simplified imports and usage
 */

import { supabase } from '@/integrations/supabase/client';
import { CacheService } from './cache.service';

/**
 * Custom API Error with retry information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  key: string;
  ttl?: number;
  tags?: string[];
  skipCache?: boolean;
}

/**
 * Query options for API operations
 */
export interface QueryOptions<T = any> {
  retry?: Partial<RetryConfig>;
  cache?: CacheConfig;
  timeout?: number;
  allowNull?: boolean;
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  data: T;
  cached?: boolean;
  timestamp: Date;
}

/**
 * Unified API Service Class
 */
class UnifiedApiService {
  private cache: CacheService;
  private activeRequests = new Map<string, Promise<any>>();
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
  };

  constructor() {
    this.cache = new CacheService();
  }

  /**
   * Execute a database query with retry and caching
   */
  async query<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    options: QueryOptions<T> = {}
  ): Promise<T | null> {
    // Check cache first
    if (options.cache && !options.cache.skipCache) {
      const cached = await this.cache.get<T>(options.cache.key);
      if (cached !== null) {
        return cached;
      }
    }

    // Execute with retry
    const result = await this.executeWithRetry(operation, options.retry, options);

    // Cache the result
    if (options.cache && !options.cache.skipCache && result) {
      await this.cache.set(options.cache.key, result, {
        ttl: options.cache.ttl,
        tags: options.cache.tags,
      });
    }

    return result;
  }

  /**
   * Execute a database mutation with retry
   */
  async mutate<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    options: QueryOptions<T> & { invalidateTags?: string[]; invalidatePatterns?: string[] } = {}
  ): Promise<T> {
    // Execute with retry
    const result = await this.executeWithRetry(operation, options.retry);

    // Invalidate caches
    if (options.invalidateTags) {
      await Promise.all(
        options.invalidateTags.map(tag => this.cache.invalidateByTag(tag))
      );
    }

    if (options.invalidatePatterns) {
      await Promise.all(
        options.invalidatePatterns.map(pattern => this.cache.invalidateByPattern(pattern))
      );
    }

    return result;
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    retryConfig: Partial<RetryConfig> = {},
    options: QueryOptions<T> = {}
  ): Promise<T | null> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const { data, error } = await operation();

        if (error) {
          throw new ApiError(
            error.message || 'Operation failed',
            error.code,
            error.status,
            this.isRetryable(error)
          );
        }

        if (data === null && !options?.allowNull) {
          throw new ApiError('No data returned', undefined, undefined, false);
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if not retryable or last attempt
        if (!this.isRetryable(error) || attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponentialBackoff
          ? Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
          : config.baseDelay;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new ApiError('Operation failed after retries');
  }

  /**
   * Single-flight pattern - prevents duplicate concurrent requests
   */
  async singleFlight<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.cache.singleFlight(key, operation);
  }

  /**
   * Stale-while-revalidate pattern
   */
  async staleWhileRevalidate<T>(
    key: string,
    operation: () => Promise<T>,
    options?: { ttl?: number; staleTime?: number }
  ): Promise<T> {
    return this.cache.staleWhileRevalidate(key, operation, options);
  }

  /**
   * Batch multiple operations
   */
  async batch<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(operations.map(op => op()));
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    if (error instanceof ApiError) {
      return error.retryable;
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      return true;
    }

    // Supabase specific errors
    const retryableSupabaseCodes = ['PGRST301', '08000', '08003', '08006', '57P03'];
    if (error.code && retryableSupabaseCodes.includes(error.code)) {
      return true;
    }

    // HTTP status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Clear cache
   */
  clearCache(keyOrPattern?: string): void {
    if (!keyOrPattern) {
      this.cache.clear();
    } else if (keyOrPattern.includes('*')) {
      this.cache.invalidateByPattern(keyOrPattern);
    } else {
      this.cache.invalidateByPattern(keyOrPattern);
    }
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const cacheHealth = await this.cache.healthCheck();
    
    // Test database connection
    let dbHealthy = false;
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      dbHealthy = !error;
    } catch (e) {
      dbHealthy = false;
    }

    return {
      status: dbHealthy && cacheHealth.status === 'healthy' ? 'healthy' : 'degraded',
      checks: {
        database: dbHealthy,
        cache: cacheHealth.status === 'healthy',
      },
      metrics: {
        cache: this.cache.getMetrics(),
        activeRequests: this.activeRequests.size,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const unifiedApi = new UnifiedApiService();
