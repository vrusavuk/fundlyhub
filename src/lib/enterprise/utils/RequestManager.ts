/**
 * Advanced request management with abortable timeouts, deduplication, and circuit breaker
 * Implements single-flight pattern and retry logic with exponential backoff
 */

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
  deduplicationKey?: string;
  scope?: {
    userId?: string;
    tenantId?: string;
    type?: 'global' | 'user' | 'tenant';
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class RequestManager {
  private pendingRequests = new Map<string, Promise<any>>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    jitter: true,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR']
  };

  /**
   * Execute request with advanced management features
   */
  async execute<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check circuit breaker
    this.checkCircuitBreaker(endpoint);

    // Handle scoped deduplication (single-flight pattern)
    if (options.deduplicationKey) {
      const scopedKey = this.getScopedDeduplicationKey(options.deduplicationKey, options.scope);
      const existing = this.pendingRequests.get(scopedKey);
      if (existing) {
        return existing as Promise<T>;
      }
    }

    // Create abortable promise with timeout
    const { promise, cleanup } = this.createAbortablePromise(
      operation,
      options.timeout || 30000,
      options.abortSignal
    );

    // Store for scoped deduplication
    let scopedKey: string | undefined;
    if (options.deduplicationKey) {
      scopedKey = this.getScopedDeduplicationKey(options.deduplicationKey, options.scope);
      this.pendingRequests.set(scopedKey, promise);
    }

    try {
      // Execute with retry logic
      const result = await this.executeWithRetry(
        () => promise,
        endpoint,
        options
      );

      // Update circuit breaker on success
      this.recordSuccess(endpoint);
      
      return result;
    } catch (error) {
      // Update circuit breaker on failure
      this.recordFailure(endpoint, error as Error);
      throw error;
    } finally {
      // Cleanup
      cleanup();
      if (scopedKey) {
        this.pendingRequests.delete(scopedKey);
      }
    }
  }

  /**
   * Create promise with timeout and abort signal support
   */
  private createAbortablePromise<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    timeoutMs: number,
    externalSignal?: AbortSignal
  ): { promise: Promise<T>; cleanup: () => void } {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;

    // Setup timeout
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Handle external abort signal
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => {
          controller.abort();
        });
      }
    }

    const promise = operation(controller.signal);

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    return { promise, cleanup };
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    const maxRetries = options.retries ?? this.defaultRetryConfig.maxRetries;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          break;
        }

        // Wait before retry with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculate retry delay with exponential backoff and optional jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay, jitter } = this.defaultRetryConfig;
    let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    if (jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, 0);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorType = this.categorizeError(error);
    return this.defaultRetryConfig.retryableErrors.includes(errorType);
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: Error): string {
    if (error.name === 'AbortError') return 'TIMEOUT';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return 'SERVER_ERROR';
    }
    return 'CLIENT_ERROR';
  }

  /**
   * Circuit breaker implementation
   */
  private checkCircuitBreaker(endpoint: string): void {
    const state = this.circuitBreakers.get(endpoint);
    if (!state) return;

    const now = Date.now();

    if (state.state === 'open') {
      if (now - state.lastFailureTime < state.config.resetTimeout) {
        throw new Error(`Circuit breaker is open for ${endpoint}`);
      } else {
        // Try to reset circuit breaker
        state.state = 'half-open';
      }
    }
  }

  private recordSuccess(endpoint: string): void {
    const state = this.circuitBreakers.get(endpoint);
    if (state) {
      state.consecutiveFailures = 0;
      state.state = 'closed';
    }
  }

  private recordFailure(endpoint: string, error: Error): void {
    let state = this.circuitBreakers.get(endpoint);
    if (!state) {
      state = {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: 0,
        config: {
          failureThreshold: 5,
          resetTimeout: 60000,
          monitoringPeriod: 60000
        }
      };
      this.circuitBreakers.set(endpoint, state);
    }

    state.consecutiveFailures++;
    state.lastFailureTime = Date.now();

    if (state.consecutiveFailures >= state.config.failureThreshold) {
      state.state = 'open';
    }
  }

  /**
   * Generate scoped deduplication key
   */
  private getScopedDeduplicationKey(
    key: string, 
    scope?: { userId?: string; tenantId?: string; type?: 'global' | 'user' | 'tenant' }
  ): string {
    if (!scope) return key;
    
    if (scope.type === 'tenant' && scope.tenantId) {
      return `t:${scope.tenantId}:${key}`;
    }
    
    if (scope.type === 'user' && scope.userId) {
      return `u:${scope.userId}:${key}`;
    }
    
    return key; // Global scope
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  lastFailureTime: number;
  config: CircuitBreakerConfig;
}