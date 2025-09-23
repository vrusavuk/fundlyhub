/**
 * Lazy loaded image component with intersection observer
 */
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  containerClassName?: string;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
}

export function LazyImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  rootMargin = '50px',
  threshold = 0.1,
  onLoad,
  onError,
  className,
  containerClassName,
  showPlaceholder = true,
  placeholderClassName,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
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

  // Preload image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      if (imageSrc !== fallbackSrc && fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        setHasError(true);
        onError?.();
      }
    };
    img.src = imageSrc;
  }, [isInView, imageSrc, fallbackSrc, onLoad, onError]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted/50', containerClassName)}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder/Loading State */}
      {!isLoaded && !hasError && showPlaceholder && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-muted animate-pulse',
          placeholderClassName
        )}>
          <ImageIcon 
            className="h-8 w-8 text-muted-foreground/50" 
            aria-hidden="true"
          />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" aria-hidden="true" />
          <span className="text-sm text-center px-4" role="alert">
            Image failed to load
          </span>
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            if (imageSrc !== fallbackSrc && fallbackSrc) {
              setImageSrc(fallbackSrc);
            } else {
              setHasError(true);
              onError?.();
            }
          }}
          {...props}
        />
      )}
    </div>
  );
}

// Specialized lazy image variants
export function LazyCardImage(props: Omit<LazyImageProps, 'containerClassName'>) {
  return (
    <LazyImage
      {...props}
      containerClassName="aspect-[4/3] rounded-t-lg"
    />
  );
}

export function LazyHeroImage(props: Omit<LazyImageProps, 'containerClassName' | 'rootMargin'>) {
  return (
    <LazyImage
      {...props}
      containerClassName="aspect-[21/9] rounded-xl"
      rootMargin="100px"
    />
  );
}

export function LazyAvatarImage(props: Omit<LazyImageProps, 'containerClassName'>) {
  return (
    <LazyImage
      {...props}
      containerClassName="aspect-square rounded-full"
    />
  );
}