/**
 * Reusable component prop types
 */
import React from 'react';

export interface ComponentWithChildren {
  children: React.ReactNode;
  className?: string;
}

export interface ComponentWithLoading {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePaginatedResult<T> extends UseAsyncResult<T[]> {
  hasMore: boolean;
  loadMore: () => void;
  page: number;
  total: number;
}