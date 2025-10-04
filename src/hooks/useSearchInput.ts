/**
 * Hook for managing search input state and behavior
 * Handles input validation, debouncing, and state synchronization
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';
import { hapticFeedback } from '@/lib/utils/mobile';

interface UseSearchInputOptions {
  initialQuery?: string;
  debounceMs?: number;
  minQueryLength?: number;
  autoFocus?: boolean;
}

interface UseSearchInputResult {
  query: string;
  debouncedQuery: string;
  isValid: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (value: string) => void;
  handleClear: () => void;
  focus: () => void;
  blur: () => void;
}

export function useSearchInput({
  initialQuery = '',
  debounceMs = 50,
  minQueryLength = 0,
  autoFocus = false
}: UseSearchInputOptions = {}): UseSearchInputResult {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  const location = useLocation();
  const { setSearchQuery, clearSearch, searchQuery: globalSearchQuery } = useGlobalSearch();

  const isOnCampaignsPage = location.pathname === '/campaigns';
  const isOnSearchPage = location.pathname === '/search';
  const isOnIntegratedSearchPage = isOnCampaignsPage || isOnSearchPage;

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Sync with global search query on integrated pages (only when NOT actively typing)
  useEffect(() => {
    if (isOnIntegratedSearchPage && globalSearchQuery !== query && !isTypingRef.current) {
      setQuery(globalSearchQuery);
    }
  }, [globalSearchQuery, isOnIntegratedSearchPage, query]);

  // Auto focus when component mounts
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleInputChange = useCallback((value: string) => {
    // Mark that user is actively typing
    isTypingRef.current = true;
    setQuery(value);
    
    // Update global search context for integrated search pages
    if (isOnIntegratedSearchPage) {
      setSearchQuery(value);
    }
    
    // Haptic feedback for mobile
    if (value.length > 0) {
      hapticFeedback.light();
    }
    
    // Clear typing flag after debounce period
    setTimeout(() => {
      isTypingRef.current = false;
    }, debounceMs + 300);
  }, [isOnIntegratedSearchPage, setSearchQuery, debounceMs]);

  const handleClear = useCallback(() => {
    setQuery('');
    if (isOnIntegratedSearchPage) {
      clearSearch();
    }
    hapticFeedback.light();
  }, [isOnIntegratedSearchPage, clearSearch]);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  const isValid = query.trim().length >= minQueryLength;

  return {
    query,
    debouncedQuery,
    isValid,
    inputRef,
    handleInputChange,
    handleClear,
    focus,
    blur
  };
}