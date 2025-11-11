/**
 * Performance Tracking Hook
 * Easy-to-use React hook for performance monitoring
 */

import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { correlationTracker } from '@/lib/monitoring/CorrelationTracker';

export function usePerformanceTracking(componentName: string) {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;
    
    if (renderStartTime.current > 0) {
      const renderDuration = performance.now() - renderStartTime.current;
      performanceMonitor.trackComponentRender(
        componentName,
        renderDuration,
        renderCount.current
      );
    }
    
    renderStartTime.current = performance.now();
  });

  const trackOperation = useCallback(
    async <T,>(
      operationName: string,
      fn: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now();
      const spanId = correlationTracker.startSpan(
        `${componentName}.${operationName}`
      );

      try {
        const result = await fn();
        const duration = performance.now() - startTime;
        
        performanceMonitor.trackCustomMetric(
          `${componentName}.${operationName}`,
          duration,
          'ms',
          { component: componentName }
        );
        
        correlationTracker.endSpan(spanId, 'success');
        return result;
      } catch (error) {
        correlationTracker.endSpan(spanId, 'error', error as Error);
        throw error;
      }
    },
    [componentName]
  );

  return {
    trackOperation,
    renderCount: renderCount.current,
  };
}
