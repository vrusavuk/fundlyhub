/**
 * Enhanced Search Hook
 * Uses Search API (API Gateway) instead of direct database queries
 * 
 * @see src/lib/services/searchApi.service.ts
 * @see supabase/functions/search-api/index.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchApi } from '@/lib/services/searchApi.service';
import type { SearchResult } from '@/types/ui/search';
import { useDebounce } from './useDebounce';

export interface UseEnhancedSearchOptions {
  query: string;
  enabled?: boolean;
  filters?: any;
  includeSuggestions?: boolean;
}

export interface UseEnhancedSearchResult {
  results: SearchResult[];
  suggestions: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  executionTimeMs: number;
  cached: boolean;
  loadMore: () => void;
  retry: () => void;
  clear: () => void;
  trackClick: (resultId: string, resultType: string) => void;
  trackSuggestionClick: (suggestionQuery: string) => void;
}

export function useEnhancedSearch(options: UseEnhancedSearchOptions): UseEnhancedSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [cached, setCached] = useState(false);
  
  const debouncedQuery = useDebounce(options.query, 50);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Show loading immediately when query changes (not debounced)
  useEffect(() => {
    if (options.query !== debouncedQuery && options.query.trim() && options.enabled) {
      setLoading(true);
    }
  }, [options.query, debouncedQuery, options.enabled]);
  
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim() || !options.enabled) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ Use Search API (gateway) instead of direct DB access
      const response = await searchApi.search(query, {
        scope: 'all',
        filters: options.filters,
        limit: 50,
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setResults(response.results as any);
      setSuggestions((response.suggestions || []) as any);
      setExecutionTimeMs(response.executionTimeMs);
      setCached(response.cached);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        setError(err.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  }, [options.enabled, options.filters]);
  
  useEffect(() => {
    executeSearch(debouncedQuery);
  }, [debouncedQuery, executeSearch]);
  
  const trackClick = useCallback((resultId: string, resultType: string) => {
    // TODO: Implement via Search API analytics endpoint
    console.log('Result clicked:', { resultId, resultType, query: options.query });
  }, [options.query]);
  
  const trackSuggestionClick = useCallback((suggestionQuery: string) => {
    // TODO: Implement via Search API analytics endpoint
    console.log('Suggestion clicked:', { suggestionQuery, originalQuery: options.query });
  }, [options.query]);
  
  return {
    results,
    suggestions,
    loading,
    error,
    hasMore: false,
    executionTimeMs,
    cached,
    loadMore: () => {},
    retry: () => executeSearch(options.query),
    clear: () => { setResults([]); setSuggestions([]); },
    trackClick,
    trackSuggestionClick,
  };
}
