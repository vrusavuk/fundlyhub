/**
 * Screen reader only content component
 * Content visible only to screen readers
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
  focusable?: boolean;
}

export function ScreenReaderOnly({ 
  children, 
  className,
  focusable = false 
}: ScreenReaderOnlyProps) {
  return (
    <span 
      className={cn(
        'sr-only',
        focusable && 'focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground focus:rounded',
        className
      )}
    >
      {children}
    </span>
  );
}

// Live region for announcements
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({ 
  children, 
  politeness = 'polite',
  atomic = false,
  relevant = 'all'
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}