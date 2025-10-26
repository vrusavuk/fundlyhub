import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loading with retry logic and loading states
 */
interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  onError?: (error: Error, attempt: number) => void;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> {
  const { maxRetries = 3, delayMs = 1000, onError } = options;

  return lazy(() => {
    let retryCount = 0;

    const retry = (): Promise<{ default: T }> => {
      return importFn().catch((error) => {
        retryCount++;

        if (retryCount > maxRetries) {
          onError?.(error, retryCount);
          throw error;
        }

        // Exponential backoff
        const delay = delayMs * Math.pow(2, retryCount - 1);
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(retry());
          }, delay);
        });
      });
    };

    return retry();
  });
}

/**
 * Preload components for instant navigation
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): void {
  importFn().catch((error) => {
    console.warn('Component preload failed:', error);
  });
}
