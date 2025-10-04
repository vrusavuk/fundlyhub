/**
 * Mutation Service
 * Handles all database write operations
 * Single Responsibility: Database mutations with cache invalidation
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cache.service';
import type { ServiceResponse } from '@/lib/enterprise/types';

/**
 * Mutation Service
 * Pure write operations with automatic cache invalidation
 */
export class MutationService {
  /**
   * Execute a mutation with cache invalidation
   */
  async mutate<T>(
    mutationBuilder: (data: any) => any,
    data: any,
    options: {
      invalidateTags?: string[];
      invalidatePatterns?: string[];
    } = {}
  ): Promise<ServiceResponse<T>> {
    const startTime = performance.now();

    try {
      const result = await mutationBuilder(data);
      
      if (result.error) {
        throw result.error;
      }

      // Invalidate affected cache entries
      if (options.invalidateTags) {
        for (const tag of options.invalidateTags) {
          await cacheService.invalidateByTag(tag);
        }
      }

      if (options.invalidatePatterns) {
        for (const pattern of options.invalidatePatterns) {
          await cacheService.invalidateByPattern(pattern);
        }
      }

      return {
        data: result.data,
        success: true,
        status: 200,
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
   * Execute multiple mutations in a transaction-like manner
   */
  async mutateBatch<T>(
    mutations: Array<{
      mutationBuilder: (data: any) => any;
      data: any;
    }>,
    options: {
      invalidateTags?: string[];
      invalidatePatterns?: string[];
    } = {}
  ): Promise<ServiceResponse<T[]>> {
    const startTime = performance.now();

    try {
      const results = await Promise.all(
        mutations.map((m) => m.mutationBuilder(m.data))
      );

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Batch mutation failed: ${errors.length} errors`);
      }

      // Invalidate affected cache entries
      if (options.invalidateTags) {
        for (const tag of options.invalidateTags) {
          await cacheService.invalidateByTag(tag);
        }
      }

      if (options.invalidatePatterns) {
        for (const pattern of options.invalidatePatterns) {
          await cacheService.invalidateByPattern(pattern);
        }
      }

      return {
        data: results.map((r) => r.data),
        success: true,
        status: 200,
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
}

// Export singleton instance
export const mutationService = new MutationService();
