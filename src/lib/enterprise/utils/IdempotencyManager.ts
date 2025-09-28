/**
 * Idempotency key management for ensuring mutations are only executed once
 * Prevents duplicate operations from causing data corruption
 */

import { EnterpriseCache } from '../EnterpriseCache';

export interface IdempotencyResult<T = any> {
  isRetry: boolean;
  result?: T;
  shouldExecute: boolean;
}

export interface IdempotencyOptions {
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
  keyPrefix?: string;
}

export class IdempotencyManager {
  private cache: EnterpriseCache;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly KEY_PREFIX = 'idempotency:';

  constructor(cache: EnterpriseCache) {
    this.cache = cache;
  }

  /**
   * Generate idempotency key from request data
   */
  generateKey(userId: string, endpoint: string, data?: any): string {
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute window
    const dataHash = data ? this.hashObject(data) : '';
    return `${this.KEY_PREFIX}${userId}:${endpoint}:${dataHash}:${timestamp}`;
  }

  /**
   * Check if operation should be executed or return cached result
   */
  async checkIdempotency<T>(
    idempotencyKey: string,
    options: IdempotencyOptions = {}
  ): Promise<IdempotencyResult<T>> {
    try {
      const cached = await this.cache.get<T>(idempotencyKey);
      
      if (cached !== null) {
        // Request was already processed
        return {
          isRetry: true,
          result: cached,
          shouldExecute: false
        };
      }

      // First time processing this request
      return {
        isRetry: false,
        shouldExecute: true
      };
    } catch (error) {
      // If cache fails, allow execution but log the error
      console.error('Idempotency check failed:', error);
      return {
        isRetry: false,
        shouldExecute: true
      };
    }
  }

  /**
   * Store operation result for future idempotency checks
   */
  async storeResult<T>(
    idempotencyKey: string,
    result: T,
    options: IdempotencyOptions = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.DEFAULT_TTL;
      await this.cache.set(idempotencyKey, result, { 
        ttl,
        tags: ['idempotency']
      });
    } catch (error) {
      // Log but don't fail the operation if caching fails
      console.error('Failed to store idempotency result:', error);
    }
  }

  /**
   * Execute operation with idempotency protection
   */
  async executeWithIdempotency<T>(
    idempotencyKey: string,
    operation: () => Promise<T>,
    options: IdempotencyOptions = {}
  ): Promise<T> {
    const check = await this.checkIdempotency<T>(idempotencyKey, options);
    
    if (!check.shouldExecute) {
      // Return cached result
      return check.result!;
    }

    // Execute the operation
    const result = await operation();
    
    // Store result for future requests
    await this.storeResult(idempotencyKey, result, options);
    
    return result;
  }

  /**
   * Cleanup expired idempotency keys
   */
  async cleanup(): Promise<number> {
    try {
      return await this.cache.invalidateByPattern(`${this.KEY_PREFIX}*`);
    } catch (error) {
      console.error('Idempotency cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Hash object to create consistent key component
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}