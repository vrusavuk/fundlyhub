/**
 * Search backdrop component for better visual separation
 * Creates a semi-transparent overlay behind the search dropdown
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface SearchBackdropProps {
  readonly show: boolean;
  readonly opacity?: number;
  readonly onClick?: () => void;
  readonly className?: string;
}

export function SearchBackdrop({
  show,
  opacity = 0.3,
  onClick,
  className
}: SearchBackdropProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-all duration-300 ease-out',
        'animate-in fade-in-0 duration-200',
        className
      )}
      style={{
        backgroundColor: `hsl(var(--background) / ${opacity})`,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={onClick}
      role="presentation"
      aria-hidden="true"
    />
  );
}