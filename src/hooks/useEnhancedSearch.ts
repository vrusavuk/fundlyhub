/**
 * Enhanced Search Hook
 * Uses SearchService instead of direct database queries
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService } from '@/lib/services/search.service';
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
  
  const debouncedQuery = useDebounce(options.query, 300);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim() || !options.enabled) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchService.search(query, {
        filters: options.filters,
        includeSuggestions: options.includeSuggestions,
      });
      
      setResults(response.results);
      setSuggestions(response.suggestions);
      setExecutionTimeMs(response.executionTimeMs);
      setCached(response.cached);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  }, [options.enabled, options.filters, options.includeSuggestions]);
  
  useEffect(() => {
    executeSearch(debouncedQuery);
  }, [debouncedQuery, executeSearch]);
  
  const trackClick = useCallback((resultId: string, resultType: string) => {
    searchService.trackSearchClick(options.query, resultId, resultType);
  }, [options.query]);
  
  const trackSuggestionClick = useCallback((suggestionQuery: string) => {
    searchService.trackSuggestionClick(options.query, suggestionQuery);
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
