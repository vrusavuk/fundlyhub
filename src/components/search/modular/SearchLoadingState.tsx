/**
 * Search loading state component
 * Displays loading indicators for different search states
 */
import React from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface SearchLoadingStateProps {
  message?: string;
  hasQuery?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchLoadingState({ 
  message,
  hasQuery = false,
  size = 'sm'
}: SearchLoadingStateProps) {
  const defaultMessage = hasQuery ? 'Searching...' : 'Loading suggestions...';
  
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size={size} />
      <span className="ml-3 text-sm text-muted-foreground">
        {message || defaultMessage}
      </span>
    </div>
  );
}