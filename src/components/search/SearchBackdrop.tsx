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
  opacity = 0,
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
        // Remove background color to not interfere with backdrop-filter
        backgroundColor: 'transparent',
      }}
      onClick={onClick}
      role="presentation"
      aria-hidden="true"
    />
  );
}