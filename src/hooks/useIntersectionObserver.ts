/**
 * Generic reusable intersection observer hook
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

interface UseIntersectionObserverReturn {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) return;
    observerRef.current.observe(element);
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (!observerRef.current) return;
    observerRef.current.unobserve(element);
  }, []);

  const disconnect = useCallback(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
  }, []);

  useEffect(() => {
    const defaultOptions: IntersectionObserverInit = {
      root: options.root || null,
      rootMargin: options.rootMargin || '-100px 0px -80% 0px',
      threshold: options.threshold || 0,
    };

    observerRef.current = new IntersectionObserver(callback, defaultOptions);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [callback, options.root, options.rootMargin, options.threshold]);

  return { observe, unobserve, disconnect };
}