/**
 * Performance monitoring component for tracking app metrics
 */
import { useEffect } from 'react';
import { usePerformanceStore } from '@/store/globalState';

export function PerformanceMonitor() {
  const { setLoadTime, setInteractionTime } = usePerformanceStore();

  useEffect(() => {
    // Track initial load time
    if ('performance' in window) {
      const loadTime = performance.now();
      setLoadTime(loadTime);

      // Track First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setLoadTime(entry.startTime);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        // Fallback for browsers that don't support paint timing
        console.warn('Paint timing not supported');
      }

      // Track interaction responsiveness
      let interactionStart = 0;
      const trackInteraction = () => {
        interactionStart = performance.now();
      };
      
      const trackInteractionEnd = () => {
        if (interactionStart > 0) {
          const interactionTime = performance.now() - interactionStart;
          setInteractionTime(interactionTime);
          interactionStart = 0;
        }
      };

      // Track clicks and key presses
      document.addEventListener('mousedown', trackInteraction);
      document.addEventListener('keydown', trackInteraction);
      document.addEventListener('mouseup', trackInteractionEnd);
      document.addEventListener('keyup', trackInteractionEnd);

      return () => {
        observer.disconnect();
        document.removeEventListener('mousedown', trackInteraction);
        document.removeEventListener('keydown', trackInteraction);
        document.removeEventListener('mouseup', trackInteractionEnd);
        document.removeEventListener('keyup', trackInteractionEnd);
      };
    }
  }, [setLoadTime, setInteractionTime]);

  // Component renders nothing - it's just for monitoring
  return null;
}

export function usePerformanceMetrics() {
  const { bundleSize, loadTime, interactionTime } = usePerformanceStore();
  
  return {
    bundleSize,
    loadTime,
    interactionTime,
    // Derived metrics
    isGoodPerformance: loadTime < 2000 && interactionTime < 100,
    performanceGrade: loadTime < 1000 ? 'A' : loadTime < 2000 ? 'B' : loadTime < 3000 ? 'C' : 'D'
  };
}