/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by temporarily disabling failing operations
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  threshold?: number;
  timeout?: number;
  halfOpenAttempts?: number;
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number = 0;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly halfOpenAttempts: number;
  
  constructor(config: CircuitBreakerConfig = {}) {
    this.threshold = config.threshold || 5;
    this.timeout = config.timeout || 60000; // 1 minute
    this.halfOpenAttempts = config.halfOpenAttempts || 3;
  }
  
  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        console.log('[CircuitBreaker] Transitioning to HALF_OPEN');
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenAttempts) {
        console.log('[CircuitBreaker] Transitioning to CLOSED');
        this.state = CircuitState.CLOSED;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      console.log('[CircuitBreaker] Transitioning to OPEN (failed during HALF_OPEN)');
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failureCount >= this.threshold) {
      console.error(`[CircuitBreaker] Opening circuit after ${this.failureCount} failures`);
      this.state = CircuitState.OPEN;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
