/**
 * Optimized search hook with proper memoization and caching
 */
import { useMemo, useCallback } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { useFundraisers } from '@/hooks/useFundraisers';

interface UseOptimizedSearchOptions {
  query: string;
  enabled?: boolean;
  category?: string;
  debounceMs?: number;
}

interface UseOptimizedSearchResult {
  results: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
  isEmpty: boolean;
}

export function useOptimizedSearch({
  query,
  enabled = true,
  category,
  debounceMs = 300
}: UseOptimizedSearchOptions): UseOptimizedSearchResult {
  
  // Memoize search parameters to prevent unnecessary API calls
  const searchParams = useMemo(() => ({
    query: query.trim(),
    enabled: enabled && query.trim().length >= 2,
    category
  }), [query, enabled, category]);

  // Use the existing search hook with memoized params
  const { 
    results, 
    loading, 
    error, 
    hasMore, 
    loadMore 
  } = useSearch(searchParams);

  // Memoize derived values
  const optimizedResults = useMemo(() => {
    if (!searchParams.enabled || !results) return [];
    
    // Apply additional filtering if category is specified
    if (category) {
      return results.filter(result => 
        result.type === category
      );
    }
    
    return results;
  }, [results, category, searchParams.enabled]);

  const totalCount = useMemo(() => optimizedResults.length, [optimizedResults]);
  const isEmpty = useMemo(() => 
    searchParams.enabled && !loading && totalCount === 0, 
    [searchParams.enabled, loading, totalCount]
  );

  // Memoize the loadMore callback
  const memoizedLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return {
    results: optimizedResults,
    loading,
    error,
    hasMore,
    loadMore: memoizedLoadMore,
    totalCount,
    isEmpty
  };
}