/**
 * Enterprise-level API service with retry logic, caching, and error handling
 */
import { supabase } from '@/integrations/supabase/client';

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

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
}

class ApiService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
  };

  /**
   * Execute API call with retry logic and error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries || !this.isRetryable(error)) {
          break;
        }

        const delay = config.exponentialBackoff
          ? Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
          : config.baseDelay;

        await this.sleep(delay);
      }
    }

    throw new ApiError(
      `API operation failed after ${config.maxRetries + 1} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      500,
      false
    );
  }

  /**
   * Execute API call with caching
   */
  async executeWithCache<T>(
    operation: () => Promise<T>,
    cacheConfig: CacheConfig,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.getFromCache<T>(cacheConfig.key);
    if (cached) {
      return cached;
    }

    // Execute with retry logic
    const result = await this.executeWithRetry(operation, retryConfig);
    
    // Cache the result
    this.setCache(cacheConfig.key, result, cacheConfig.ttl);
    
    return result;
  }

  /**
   * Clear cache by key or pattern
   */
  clearCache(keyOrPattern?: string): void {
    if (!keyOrPattern) {
      this.cache.clear();
      return;
    }

    if (keyOrPattern.includes('*')) {
      const pattern = keyOrPattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(keyOrPattern);
    }
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private isRetryable(error: any): boolean {
    // Network errors are typically retryable
    if (error instanceof TypeError && error.message.includes('Load failed')) {
      return true;
    }
    
    // Supabase errors with specific codes
    if (error?.code) {
      const retryableCodes = ['PGRST301', 'PGRST302', '54000', '53300'];
      return retryableCodes.includes(error.code);
    }

    // HTTP status codes that are retryable
    if (error?.status) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiService = new ApiService();

// Legacy export for backward compatibility
export const enhancedApiService = apiService;