/**
 * Enhanced responsive image component with progressive loading
 * Provides optimized image loading, lazy loading, and fallback handling
 */
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'photo' | 'wide' | 'tall' | string;
  quality?: 'low' | 'medium' | 'high';
  blur?: boolean;
  overlay?: boolean;
  overlayColor?: string;
  loadingBehavior?: 'lazy' | 'eager';
  showFallback?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  containerClassName?: string;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  photo: 'aspect-[4/3]',
  wide: 'aspect-[21/9]',
  tall: 'aspect-[3/4]',
};

export function ResponsiveImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  aspectRatio = 'photo',
  quality = 'medium',
  blur = false,
  overlay = false,
  overlayColor = 'black/40',
  loadingBehavior = 'lazy',
  showFallback = true,
  onLoad,
  onError,
  containerClassName,
  className,
  ...props
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loadingBehavior === 'eager') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loadingBehavior]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (imageSrc !== fallbackSrc && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
    onError?.();
  };

  const getAspectRatioClass = () => {
    if (aspectRatio && aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses]) {
      return aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses];
    }
    return aspectRatio;
  };

  const getQualityClasses = () => {
    switch (quality) {
      case 'low':
        return 'image-rendering-pixelated';
      case 'high':
        return 'image-rendering-crisp-edges';
      default:
        return 'image-rendering-auto';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted/50',
        getAspectRatioClass(),
        containerClassName
      )}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}

      {/* Error State */}
      {hasError && showFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <span className="text-sm text-center px-4">Failed to load image</span>
        </div>
      )}

      {/* Image */}
      {isVisible && !hasError && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            blur && 'blur-sm hover:blur-none transition-all duration-300',
            getQualityClasses(),
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={loadingBehavior}
          {...props}
        />
      )}

      {/* Overlay */}
      {overlay && !isLoading && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            `bg-${overlayColor}`,
            'opacity-0 hover:opacity-100'
          )}
        />
      )}

      {/* Progressive Enhancement Blur */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/70 to-muted animate-pulse" />
      )}
    </div>
  );
}

// Specialized variants for common use cases
export function CardImage(props: Omit<ResponsiveImageProps, 'aspectRatio'>) {
  return (
    <ResponsiveImage
      {...props}
      aspectRatio="photo"
      containerClassName="rounded-t-lg overflow-hidden"
    />
  );
}

export function HeroImage(props: Omit<ResponsiveImageProps, 'aspectRatio'>) {
  return (
    <ResponsiveImage
      {...props}
      aspectRatio="wide"
      quality="high"
      loadingBehavior="eager"
      overlay={true}
      containerClassName="rounded-xl"
    />
  );
}

export function AvatarImage(props: Omit<ResponsiveImageProps, 'aspectRatio'>) {
  return (
    <ResponsiveImage
      {...props}
      aspectRatio="square"
      containerClassName="rounded-full"
      className="object-cover"
    />
  );
}