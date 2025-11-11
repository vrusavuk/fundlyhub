/**
 * Hook for managing search navigation and URL updates
 * Centralizes navigation logic for search functionality
 */
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import { hapticFeedback } from '@/lib/utils/mobile';
import { logger } from '@/lib/services/logger.service';

interface UseSearchNavigationOptions {
  onNavigate?: () => void;
}

interface UseSearchNavigationResult {
  handleSubmit: (query: string, resultCount?: number) => void;
  handleSuggestionSelect: (suggestion: SearchSuggestion) => void;
  handleResultClick: (result: any, query: string, resultCount: number) => void;
  handleViewAllResults: (query: string, resultCount: number) => void;
}

export function useSearchNavigation({
  onNavigate
}: UseSearchNavigationOptions = {}): UseSearchNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecentSearch, trackSearch } = useSearchSuggestions({
    query: '',
    enabled: true
  });

  const handleSubmit = useCallback((query: string, resultCount: number = 0) => {
    if (!query.trim()) return;

    try {
      // Add to recent searches and track
      addRecentSearch(query.trim());
      trackSearch(query.trim(), resultCount);
      
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      hapticFeedback.medium();
      
      onNavigate?.();
    } catch (error) {
      logger.error('Navigation failed', error as Error, {
        componentName: 'useSearchNavigation',
        operationName: 'handleSubmit',
        metadata: { query }
      });
    }
  }, [addRecentSearch, trackSearch, navigate, onNavigate]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    try {
      const selectedQuery = suggestion.text;
      
      // Add to recent searches and track
      addRecentSearch(selectedQuery, suggestion.category);
      trackSearch(selectedQuery, 0, suggestion.category);
      
      // Always navigate to search page for suggestions
      navigate(`/search?q=${encodeURIComponent(selectedQuery)}`, { replace: false });
      hapticFeedback.light();
      
      onNavigate?.();
    } catch (error) {
      logger.error('Suggestion navigation failed', error as Error, {
        componentName: 'useSearchNavigation',
        operationName: 'handleSuggestionSelect',
        metadata: { suggestion }
      });
    }
  }, [addRecentSearch, trackSearch, navigate, onNavigate]);

  const handleResultClick = useCallback((result: any, query: string, resultCount: number) => {
    try {
      // Track the click
      trackSearch(query, resultCount, result.type);
      addRecentSearch(query, result.type);
      
      // Navigate to result
      navigate(result.link);
      hapticFeedback.light();
      
      onNavigate?.();
    } catch (error) {
      logger.error('Result navigation failed', error as Error, {
        componentName: 'useSearchNavigation',
        operationName: 'handleResultClick',
        metadata: { query, resultType: result.type }
      });
    }
  }, [addRecentSearch, trackSearch, navigate, onNavigate]);

  const handleViewAllResults = useCallback((query: string, resultCount: number) => {
    if (!query.trim()) return;

    try {
      addRecentSearch(query.trim());
      trackSearch(query.trim(), resultCount);
      
      const targetUrl = `/search?q=${encodeURIComponent(query.trim())}`;
      navigate(targetUrl, { replace: false });
      hapticFeedback.medium();
      
      onNavigate?.();
    } catch (error) {
      logger.error('View all results navigation failed', error as Error, {
        componentName: 'useSearchNavigation',
        operationName: 'handleViewAllResults',
        metadata: { query, resultCount }
      });
    }
  }, [addRecentSearch, trackSearch, navigate, onNavigate]);

  return {
    handleSubmit,
    handleSuggestionSelect,
    handleResultClick,
    handleViewAllResults
  };
}