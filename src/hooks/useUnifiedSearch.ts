/**
 * Unified Search Hook
 * Consolidates useSearch, useEnhancedSearch, useOptimizedSearch, and useSearchSuggestions
 * Provides a single, comprehensive search interface
 * 
 * @see src/lib/services/searchApi.service.ts
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { searchApi } from '@/lib/services/searchApi.service';
import { searchSuggestionsService, SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import type { SearchResult } from '@/types/ui/search';
import { useDebounce } from './useDebounce';
import { logger } from '@/lib/services/logger.service';

export type SearchScope = 'all' | 'campaigns' | 'users' | 'orgs';

export interface UseUnifiedSearchOptions {
  /** The search query string */
  query: string;
  /** Whether search is enabled */
  enabled?: boolean;
  /** Search scope - what types to include */
  scope?: SearchScope;
  /** Additional filters */
  filters?: Record<string, any>;
  /** Whether to include suggestions */
  includeSuggestions?: boolean;
  /** Whether to include recent searches */
  includeRecent?: boolean;
  /** Whether to include trending searches */
  includeTrending?: boolean;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
  /** Maximum number of results to return */
  limit?: number;
}

export interface UseUnifiedSearchResult {
  // Results
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  recentSearches: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  
  // State
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  isEmpty: boolean;
  
  // Metrics
  executionTimeMs: number;
  cached: boolean;
  
  // Actions
  loadMore: () => void;
  retry: () => void;
  clear: () => void;
  
  // Analytics
  trackClick: (resultId: string, resultType: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseUnifiedSearchOptions, 'query' | 'filters'>> = {
  enabled: true,
  scope: 'all',
  includeSuggestions: true,
  includeRecent: true,
  includeTrending: true,
  debounceMs: 300,
  maxSuggestions: 8,
  limit: 50,
};

export function useUnifiedSearch(options: UseUnifiedSearchOptions): UseUnifiedSearchResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [cached, setCached] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchRef = useRef<string>('');
  const mountedRef = useRef(true);
  
  // Debounced query
  const debouncedQuery = useDebounce(config.query, config.debounceMs);
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Load initial data (recent and trending searches)
  useEffect(() => {
    const loadInitialData = () => {
      try {
        if (config.includeRecent) {
          const recent = searchSuggestionsService.getRecentSearches(config.maxSuggestions);
          if (mountedRef.current) {
            setRecentSearches(recent);
          }
        }
        
        if (config.includeTrending) {
          const trending = searchSuggestionsService.getTrendingSearches(config.maxSuggestions);
          if (mountedRef.current) {
            setTrendingSearches(trending);
          }
        }
      } catch (err) {
        logger.error('Error loading initial search data', err as Error, {
          componentName: 'useUnifiedSearch',
          operationName: 'loadInitialData',
        });
      }
    };
    
    loadInitialData();
  }, [config.includeRecent, config.includeTrending, config.maxSuggestions]);
  
  // Show loading immediately when query changes (before debounce)
  useEffect(() => {
    if (config.query !== debouncedQuery && config.query.trim() && config.enabled) {
      setLoading(true);
    }
  }, [config.query, debouncedQuery, config.enabled]);
  
  // Main search effect
  useEffect(() => {
    const query = debouncedQuery.trim();
    
    // Clear results if query is empty or disabled
    if (!query || !config.enabled) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      setError(null);
      setExecutionTimeMs(0);
      setCached(false);
      setOffset(0);
      setHasMore(false);
      lastSearchRef.current = '';
      return;
    }
    
    // Skip if query hasn't changed
    if (query === lastSearchRef.current) {
      return;
    }
    
    // Don't search if query is too short (< 2 chars)
    if (query.length < 2) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      setError(null);
      lastSearchRef.current = query;
      return;
    }
    
    lastSearchRef.current = query;
    
    // Abort previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setOffset(0);
    
    // Get local suggestions
    const localSuggestions = searchSuggestionsService.getSuggestions(query, config.maxSuggestions);
    setSuggestions(localSuggestions);
    
    // Execute search
    searchApi.search(query, {
      scope: config.scope,
      filters: config.filters,
      limit: config.limit,
    }).then(response => {
      if (!mountedRef.current) return;
      
      if (response.error) {
        setError(response.error);
        setResults([]);
      } else {
        setResults(response.results as SearchResult[]);
        setExecutionTimeMs(response.executionTimeMs);
        setCached(response.cached);
        setHasMore(response.results.length >= config.limit);
      }
      setLoading(false);
    }).catch((err: Error) => {
      if (!mountedRef.current) return;
      if (err.name !== 'AbortError') {
        logger.error('Search error', err, {
          componentName: 'useUnifiedSearch',
          operationName: 'search',
          metadata: { query }
        });
        setError(err.message || 'Search failed');
        setResults([]);
      }
      setLoading(false);
    });
  }, [debouncedQuery, config.enabled, config.scope, config.filters, config.limit, config.maxSuggestions]);
  
  // Load more results
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    const query = debouncedQuery.trim();
    if (!query || query.length < 2) return;
    
    const newOffset = offset + config.limit;
    setLoading(true);
    
    searchApi.search(query, {
      scope: config.scope,
      filters: config.filters,
      limit: config.limit,
      offset: newOffset,
    }).then(response => {
      if (!mountedRef.current) return;
      
      if (response.error) {
        setError(response.error);
      } else {
        setResults(prev => [...prev, ...response.results as SearchResult[]]);
        setOffset(newOffset);
        setHasMore(response.results.length >= config.limit);
      }
      setLoading(false);
    }).catch((err: Error) => {
      if (!mountedRef.current) return;
      logger.error('Load more error', err, {
        componentName: 'useUnifiedSearch',
        operationName: 'loadMore',
        metadata: { query, offset: newOffset }
      });
      setError(err.message || 'Failed to load more results');
      setLoading(false);
    });
  }, [loading, hasMore, debouncedQuery, offset, config.limit, config.scope, config.filters]);
  
  // Retry search
  const retry = useCallback(() => {
    lastSearchRef.current = ''; // Reset to force re-search
  }, []);
  
  // Clear search
  const clear = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
    setOffset(0);
    setHasMore(false);
    lastSearchRef.current = '';
  }, []);
  
  // Analytics
  const trackClick = useCallback((resultId: string, resultType: string) => {
    searchSuggestionsService.trackSearch(config.query, results.length, resultType);
  }, [config.query, results.length]);
  
  const addRecentSearch = useCallback((query: string) => {
    searchSuggestionsService.addRecentSearch(query);
    // Refresh recent searches
    const recent = searchSuggestionsService.getRecentSearches(config.maxSuggestions);
    if (mountedRef.current) {
      setRecentSearches(recent);
    }
  }, [config.maxSuggestions]);
  
  const clearRecentSearches = useCallback(() => {
    searchSuggestionsService.clearRecentSearches();
    setRecentSearches([]);
  }, []);
  
  // Derived values
  const totalCount = useMemo(() => results.length, [results]);
  const isEmpty = useMemo(() => 
    config.enabled && !loading && config.query.trim().length >= 2 && totalCount === 0, 
    [config.enabled, loading, config.query, totalCount]
  );
  
  return {
    results,
    suggestions,
    recentSearches,
    trendingSearches,
    loading,
    error,
    hasMore,
    totalCount,
    isEmpty,
    executionTimeMs,
    cached,
    loadMore,
    retry,
    clear,
    trackClick,
    addRecentSearch,
    clearRecentSearches,
  };
}

/**
 * Utility function for search text highlighting
 * Moved from useSearchHighlight hook - this is a pure function, not React state
 */
export function highlightSearchText(
  text: string,
  query: string,
  options: { caseSensitive?: boolean; highlightClassName?: string } = {}
): string {
  const { caseSensitive = false, highlightClassName = 'search-highlight' } = options;
  
  if (!query.trim() || !text) return text;
  
  const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
  if (searchTerms.length === 0) return text;
  
  let highlightedText = text;
  
  for (const term of searchTerms) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${escapedTerm})`, flags);
    
    highlightedText = highlightedText.replace(
      regex,
      `<mark class="${highlightClassName}">$1</mark>`
    );
  }
  
  return highlightedText;
}
