/**
 * Hook for managing search suggestions and recent searches
 * Provides intelligent search suggestions with caching and debouncing
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchSuggestionsService, SearchSuggestion } from '@/lib/services/searchSuggestions.service';

interface UseSearchSuggestionsOptions {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  maxSuggestions?: number;
  includeRecent?: boolean;
  includeTrending?: boolean;
  category?: string;
}

interface UseSearchSuggestionsResult {
  suggestions: SearchSuggestion[];
  recentSearches: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  loading: boolean;
  addRecentSearch: (query: string, category?: 'campaign' | 'user' | 'organization') => void;
  clearRecentSearches: () => void;
  trackSearch: (query: string, resultCount: number, category?: string) => void;
}

export function useSearchSuggestions({
  query,
  enabled = true,
  debounceMs = 150,
  maxSuggestions = 8,
  includeRecent = true,
  includeTrending = true,
  category
}: UseSearchSuggestionsOptions): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Load initial data
  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    
    try {
      const recent = includeRecent ? searchSuggestionsService.getRecentSearches() : [];
      const trending = includeTrending ? searchSuggestionsService.getTrendingSearches() : [];
      
      setRecentSearches(recent);
      setTrendingSearches(trending);
    } catch (error) {
      console.error('Failed to load initial search data:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled, includeRecent, includeTrending]);

  // Get suggestions based on query
  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      let newSuggestions: SearchSuggestion[] = [];

      if (category) {
        // Get category-specific suggestions
        const categorySuggestions = searchSuggestionsService.getCategorySuggestions(
          category, 
          maxSuggestions
        );
        newSuggestions = categorySuggestions;
      } else {
        // Get general suggestions
        newSuggestions = searchSuggestionsService.getSuggestions(
          debouncedQuery, 
          maxSuggestions
        );
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, enabled, maxSuggestions, category]);

  // Add recent search
  const addRecentSearch = useCallback((
    searchQuery: string, 
    searchCategory?: 'campaign' | 'user' | 'organization'
  ) => {
    try {
      searchSuggestionsService.addRecentSearch(searchQuery, searchCategory);
      
      // Update local state
      const updated = searchSuggestionsService.getRecentSearches();
      setRecentSearches(updated);
    } catch (error) {
      console.error('Failed to add recent search:', error);
    }
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    try {
      searchSuggestionsService.clearRecentSearches();
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  // Track search analytics
  const trackSearch = useCallback((
    searchQuery: string, 
    resultCount: number, 
    searchCategory?: string
  ) => {
    try {
      searchSuggestionsService.trackSearch(searchQuery, resultCount, searchCategory);
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);

  // Memoize results for performance
  const result = useMemo(() => ({
    suggestions,
    recentSearches,
    trendingSearches,
    loading,
    addRecentSearch,
    clearRecentSearches,
    trackSearch
  }), [
    suggestions,
    recentSearches,
    trendingSearches,
    loading,
    addRecentSearch,
    clearRecentSearches,
    trackSearch
  ]);

  return result;
}