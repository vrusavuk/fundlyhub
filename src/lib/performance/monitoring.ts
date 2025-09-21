/**
 * Performance monitoring and optimization utilities
 * Provides tools for monitoring and improving application performance
 */
import React, { useEffect, useRef, useCallback } from 'react';

// Performance metrics tracking
export interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  dataFetchTime?: number;
  interactionTime?: number;
}

// Custom hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} mounted in ${mountDuration}ms`);
    }

    return () => {
      const totalLifetime = Date.now() - mountTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} total lifetime: ${totalLifetime}ms`);
      }
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    renderStartTime.current = Date.now();
  }, []);

  const trackRenderComplete = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime}ms`);
    }
  }, [componentName]);

  return { trackRender, trackRenderComplete };
};

// Debounce hook for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useRef<T>();
  const lastExecuted = useRef<number>(0);

  throttledCallback.current = useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastExecuted.current >= delay) {
        lastExecuted.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );

  return throttledCallback.current;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
      });
    }
  }, []);

  return { checkMemoryUsage };
};

// Bundle size analyzer (development only)
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in development mode');
    console.log('Consider adding webpack-bundle-analyzer for detailed analysis');
  }
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Performance budget thresholds
    const budgets = {
      domContentLoaded: 1000, // 1 second
      firstPaint: 1000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
    };

    // Check against budgets
    Object.entries(metrics).forEach(([metric, value]) => {
      const budget = budgets[metric as keyof typeof budgets];
      if (value > budget) {
        console.warn(`Performance budget exceeded for ${metric}: ${value}ms (budget: ${budget}ms)`);
      }
    });

    return metrics;
  }
  
  return null;
};