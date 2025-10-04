/**
 * Query Service
 * Handles all read-only database queries
 * Single Responsibility: Database queries with caching
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cache.service';
import type { ServiceResponse } from '@/lib/enterprise/types';

/**
 * Query Service
 * Pure read operations with intelligent caching
 */
export class QueryService {
  /**
   * Execute a query with caching
   */
  async query<T>(
    queryBuilder: () => any,
    cacheKey: string,
    options: {
      ttl?: number;
      tags?: string[];
      skipCache?: boolean;
    } = {}
  ): Promise<ServiceResponse<T>> {
    const startTime = performance.now();

    try {
      // Skip cache if requested
      if (options.skipCache) {
        const result = await queryBuilder();
        if (result.error) throw result.error;
        
        return {
          data: result.data,
          success: true,
          status: 200,
          cached: false,
          responseTime: performance.now() - startTime,
          correlationId: crypto.randomUUID(),
        };
      }

      // Try cache first
      const data = await cacheService.getOrSet<T>(
        cacheKey,
        async () => {
          const result = await queryBuilder();
          if (result.error) throw result.error;
          return result.data;
        },
        {
          ttl: options.ttl,
          tags: options.tags,
        }
      );

      return {
        data,
        success: true,
        status: 200,
        cached: true,
        responseTime: performance.now() - startTime,
        correlationId: crypto.randomUUID(),
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        status: 500,
        cached: false,
        responseTime: performance.now() - startTime,
        correlationId: crypto.randomUUID(),
        metadata: {
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Error',
          },
        },
      };
    }
  }

  /**
   * Execute multiple queries in parallel
   */
  async queryBatch<T>(
    queries: Array<{
      queryBuilder: () => any;
      cacheKey: string;
      options?: {
        ttl?: number;
        tags?: string[];
        skipCache?: boolean;
      };
    }>
  ): Promise<ServiceResponse<T[]>> {
    const startTime = performance.now();

    try {
      const results = await Promise.all(
        queries.map((q) => this.query<T>(q.queryBuilder, q.cacheKey, q.options))
      );

      const allSuccessful = results.every((r) => r.success);
      const data = results.map((r) => r.data);

      return {
        data,
        success: allSuccessful,
        status: allSuccessful ? 200 : 207, // 207 = Multi-Status
        cached: false,
        responseTime: performance.now() - startTime,
        correlationId: crypto.randomUUID(),
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        status: 500,
        cached: false,
        responseTime: performance.now() - startTime,
        correlationId: crypto.randomUUID(),
        metadata: {
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Error',
          },
        },
      };
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateCache(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await cacheService.invalidateByTag(tag);
    }
  }
}

// Export singleton instance
export const queryService = new QueryService();
