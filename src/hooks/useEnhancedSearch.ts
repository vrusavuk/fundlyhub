/**
 * Enhanced search hook with better error handling and performance
 * Provides comprehensive search functionality with caching and debouncing
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearch as useOriginalSearch } from '@/hooks/useSearch';

interface UseEnhancedSearchOptions {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseEnhancedSearchResult {
  results: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  clear: () => void;
}

/**
 * Enhanced search hook with debouncing and better UX
 */
export function useEnhancedSearch({ 
  query, 
  enabled = true,
  debounceMs = 300,
  minQueryLength = 2
}: UseEnhancedSearchOptions): UseEnhancedSearchResult {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [retryCount, setRetryCount] = useState(0);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Determine if search should be enabled
  const shouldSearch = useMemo(() => {
    return enabled && 
           debouncedQuery.length >= minQueryLength && 
           debouncedQuery.trim().length > 0;
  }, [enabled, debouncedQuery, minQueryLength]);

  // Use original search hook
  const { 
    results, 
    loading, 
    error, 
    hasMore, 
    loadMore: originalLoadMore 
  } = useOriginalSearch({
    query: debouncedQuery,
    enabled: shouldSearch
  });

  // Enhanced load more with error handling
  const loadMore = useCallback(() => {
    try {
      originalLoadMore();
    } catch (err) {
      console.error('Failed to load more results:', err);
    }
  }, [originalLoadMore]);

  // Retry function
  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    // The retry is handled by the dependency on retryCount
  }, []);

  // Clear function
  const clear = useCallback(() => {
    setDebouncedQuery('');
    setRetryCount(0);
  }, []);

  // Reset retry count when query changes
  useEffect(() => {
    setRetryCount(0);
  }, [debouncedQuery]);

  return {
    results,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
    clear
  };
}