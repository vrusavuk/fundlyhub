/**
 * Configurable backdrop component for the tour
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface TourBackdropProps {
  readonly show: boolean;
  readonly opacity?: number;
  readonly allowInteraction?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
}

export function TourBackdrop({
  show,
  opacity = 0.6,
  allowInteraction = false,
  onClick,
  className
}: TourBackdropProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-all duration-300',
        allowInteraction ? 'pointer-events-none' : 'pointer-events-auto',
        className
      )}
      style={{
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        backdropFilter: allowInteraction ? 'none' : 'blur(2px)'
      }}
      onClick={onClick}
      role="presentation"
      aria-hidden="true"
    />
  );
}