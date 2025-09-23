/**
 * Lazy component loader with intersection observer
 */
import React, { useState, useRef, useEffect, Suspense, ComponentType } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  onError?: (error: Error) => void;
  className?: string;
  [key: string]: any; // Props to pass to the loaded component
}

export function LazyComponent({
  loader,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  onError,
  className,
  ...componentProps
}: LazyComponentProps) {
  const [isInView, setIsInView] = useState(false);
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  // Load component when in view
  useEffect(() => {
    if (!isInView) return;

    loader()
      .then((module) => {
        setComponent(() => module.default);
      })
      .catch((err) => {
        setError(err);
        onError?.(err);
      });
  }, [isInView, loader, onError]);

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message="Failed to load component"
          onRetry={() => {
            setError(null);
            setComponent(null);
            setIsInView(false);
            // Re-trigger intersection observer
            if (containerRef.current) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                  }
                },
                { rootMargin, threshold }
              );
              observer.observe(containerRef.current);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {Component ? (
        <Suspense fallback={fallback || <LoadingState />}>
          <Component {...componentProps} />
        </Suspense>
      ) : (
        fallback || <LoadingState />
      )}
    </div>
  );
}

// Hook for lazy loading components
export function useLazyComponent(
  loader: () => Promise<{ default: ComponentType<any> }>,
  dependencies: any[] = []
) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = async () => {
    try {
      setLoading(true);
      setError(null);
      const module = await loader();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponent();
  }, dependencies);

  return { Component, loading, error, retry: loadComponent };
}