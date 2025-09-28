/**
 * Distributed rate limiter using token bucket algorithm
 * Provides tiered limits and proper rate limiting headers
 */

import { EnterpriseCache } from '../EnterpriseCache';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyGenerator?: (context: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface UserTier {
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export class RateLimiter {
  private cache: EnterpriseCache;
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests, please try again later.'
  };

  // Predefined user tiers
  private readonly userTiers: Record<string, UserTier> = {
    anonymous: {
      name: 'Anonymous',
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    authenticated: {
      name: 'Authenticated',
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    premium: {
      name: 'Premium',
      requestsPerMinute: 200,
      requestsPerHour: 5000,
      requestsPerDay: 50000
    },
    admin: {
      name: 'Admin',
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      requestsPerDay: 100000
    }
  };

  constructor(cache: EnterpriseCache) {
    this.cache = cache;
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    identifier: string,
    userTier: string = 'anonymous',
    endpoint?: string
  ): Promise<RateLimitResult> {
    const tier = this.userTiers[userTier] || this.userTiers.anonymous;
    
    // Check multiple time windows
    const checks = await Promise.all([
      this.checkWindow(identifier, 'minute', tier.requestsPerMinute, 60 * 1000),
      this.checkWindow(identifier, 'hour', tier.requestsPerHour, 60 * 60 * 1000),
      this.checkWindow(identifier, 'day', tier.requestsPerDay, 24 * 60 * 60 * 1000)
    ]);

    // Find the most restrictive result
    const restrictive = checks.find(check => !check.allowed) || checks[0];
    
    return restrictive;
  }

  /**
   * Consume a request token
   */
  async consumeRequest(
    identifier: string,
    userTier: string = 'anonymous',
    endpoint?: string
  ): Promise<RateLimitResult> {
    const result = await this.checkRateLimit(identifier, userTier, endpoint);
    
    if (result.allowed) {
      // Increment counters for all windows
      const tier = this.userTiers[userTier] || this.userTiers.anonymous;
      await Promise.all([
        this.incrementWindow(identifier, 'minute', 60 * 1000),
        this.incrementWindow(identifier, 'hour', 60 * 60 * 1000),
        this.incrementWindow(identifier, 'day', 24 * 60 * 60 * 1000)
      ]);
    }
    
    return result;
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
      ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
    };
  }

  /**
   * Reset rate limit for a user (admin function)
   */
  async resetRateLimit(identifier: string): Promise<void> {
    await Promise.all([
      this.cache.invalidateByPattern(`ratelimit:${identifier}:*`)
    ]);
  }

  /**
   * Get current usage stats for a user
   */
  async getUsageStats(identifier: string): Promise<Record<string, any>> {
    const [minute, hour, day] = await Promise.all([
      this.getWindowUsage(identifier, 'minute'),
      this.getWindowUsage(identifier, 'hour'),
      this.getWindowUsage(identifier, 'day')
    ]);

    return { minute, hour, day };
  }

  /**
   * Check rate limit for a specific time window
   */
  private async checkWindow(
    identifier: string,
    window: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}:${window}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    try {
      const current = await this.cache.get<number>(key) || 0;
      const remaining = Math.max(0, limit - current);
      const allowed = current < limit;

      return {
        allowed,
        limit,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
      };
    } catch (error) {
      // If cache fails, allow the request but log the error
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetTime
      };
    }
  }

  /**
   * Increment request counter for a time window
   */
  private async incrementWindow(
    identifier: string,
    window: string,
    windowMs: number
  ): Promise<void> {
    const key = `ratelimit:${identifier}:${window}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const ttl = windowMs + 1000; // Add buffer for cleanup

    try {
      const current = await this.cache.get<number>(key) || 0;
      await this.cache.set(key, current + 1, { ttl });
    } catch (error) {
      // Log but don't fail the request if caching fails
      console.error('Rate limit increment failed:', error);
    }
  }

  /**
   * Get current usage for a time window
   */
  private async getWindowUsage(identifier: string, window: string): Promise<number> {
    const key = `ratelimit:${identifier}:${window}`;
    try {
      return await this.cache.get<number>(key) || 0;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return 0;
    }
  }

  /**
   * Generate rate limit key based on request context
   */
  generateKey(context: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
  }): string {
    // Priority: userId > ipAddress > userAgent
    if (context.userId) {
      return `user:${context.userId}`;
    }
    if (context.ipAddress) {
      return `ip:${context.ipAddress}`;
    }
    if (context.userAgent) {
      // Hash user agent to avoid long keys
      const hash = this.simpleHash(context.userAgent);
      return `ua:${hash}`;
    }
    return 'anonymous';
  }

  /**
   * Determine user tier based on context
   */
  getUserTier(context: {
    userId?: string;
    userRole?: string;
    isAuthenticated?: boolean;
  }): string {
    if (context.userRole === 'admin' || context.userRole === 'super_admin') {
      return 'admin';
    }
    if (context.userRole === 'premium') {
      return 'premium';
    }
    if (context.isAuthenticated || context.userId) {
      return 'authenticated';
    }
    return 'anonymous';
  }

  /**
   * Simple hash function for generating consistent keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}