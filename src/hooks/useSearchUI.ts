/**
 * Unified Search UI Hook
 * Consolidates useSearchInput, useSearchKeyboard, useSearchModal, and useSearchNavigation
 * Provides a single interface for all search UI behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';
import { searchSuggestionsService, SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import { hapticFeedback } from '@/lib/utils/mobile';
import { logger } from '@/lib/services/logger.service';

export interface UseSearchUIOptions {
  /** Initial query value */
  initialQuery?: string;
  /** Debounce delay for input changes (ms) */
  debounceMs?: number;
  /** Minimum query length for validation */
  minQueryLength?: number;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Whether the search UI is open/active */
  isOpen?: boolean;
  /** Number of navigable items (for keyboard navigation) */
  itemCount?: number;
  /** Callback when modal should close */
  onClose?: () => void;
  /** Callback when navigation occurs */
  onNavigate?: () => void;
}

export interface UseSearchUIResult {
  // Input state
  query: string;
  debouncedQuery: string;
  isValid: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  
  // Keyboard navigation
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  resetSelection: () => void;
  
  // Input actions
  handleInputChange: (value: string) => void;
  handleClear: () => void;
  focus: () => void;
  blur: () => void;
  
  // Navigation actions
  handleSubmit: (resultCount?: number) => void;
  handleSuggestionSelect: (suggestion: SearchSuggestion) => void;
  handleResultClick: (result: { link: string; id: string; type: string }, resultCount: number) => void;
  handleViewAllResults: (resultCount: number) => void;
  
  // Modal state
  isOpen: boolean;
  close: () => void;
}

const DEFAULT_OPTIONS = {
  initialQuery: '',
  debounceMs: 50,
  minQueryLength: 0,
  autoFocus: false,
  isOpen: false,
  itemCount: 0,
};

export function useSearchUI(options: UseSearchUIOptions = {}): UseSearchUIResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [query, setQuery] = useState(config.initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(config.initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(config.isOpen);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery, clearSearch, searchQuery: globalSearchQuery, closeHeaderSearch } = useGlobalSearch();
  
  // Derived state
  const isOnCampaignsPage = location.pathname === '/campaigns';
  const isOnSearchPage = location.pathname === '/search';
  const isOnIntegratedSearchPage = isOnCampaignsPage || isOnSearchPage;
  const isValid = query.trim().length >= config.minQueryLength;
  
  // Sync isOpen with options
  useEffect(() => {
    setIsOpen(config.isOpen);
  }, [config.isOpen]);
  
  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, config.debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, config.debounceMs]);
  
  // Sync with global search query on integrated pages (only when NOT actively typing)
  useEffect(() => {
    if (isOnIntegratedSearchPage && globalSearchQuery !== query && !isTypingRef.current) {
      setQuery(globalSearchQuery);
    }
  }, [globalSearchQuery, isOnIntegratedSearchPage, query]);
  
  // Auto focus when component mounts or opens
  useEffect(() => {
    if ((config.autoFocus || isOpen) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [config.autoFocus, isOpen]);
  
  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= config.itemCount) {
      setSelectedIndex(config.itemCount > 0 ? config.itemCount - 1 : -1);
    }
  }, [config.itemCount, selectedIndex]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1);
      return;
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < config.itemCount - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, config.itemCount]);
  
  // Input handlers
  const handleInputChange = useCallback((value: string) => {
    isTypingRef.current = true;
    setQuery(value);
    setSelectedIndex(-1); // Reset selection on input change
    
    if (isOnIntegratedSearchPage) {
      setSearchQuery(value);
    }
    
    if (value.length > 0) {
      hapticFeedback.light();
    }
    
    // Clear typing flag after debounce period
    setTimeout(() => {
      isTypingRef.current = false;
    }, config.debounceMs + 300);
  }, [isOnIntegratedSearchPage, setSearchQuery, config.debounceMs]);
  
  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedIndex(-1);
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
  
  // Navigation handlers
  const handleSubmit = useCallback((resultCount?: number) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    // Add to recent searches
    searchSuggestionsService.addRecentSearch(trimmedQuery);
    
    // Track the search
    searchSuggestionsService.trackSearch(trimmedQuery, resultCount || 0);
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    
    hapticFeedback.medium();
    closeHeaderSearch();
    config.onNavigate?.();
    
    logger.debug('Search submitted', {
      componentName: 'useSearchUI',
      operationName: 'handleSubmit',
      metadata: { query: trimmedQuery, resultCount }
    });
  }, [query, navigate, closeHeaderSearch, config.onNavigate]);
  
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    const suggestionQuery = suggestion.text || '';
    if (!suggestionQuery) return;
    
    // Add to recent searches
    searchSuggestionsService.addRecentSearch(suggestionQuery);
    
    // Navigate to search with the suggestion
    navigate(`/search?q=${encodeURIComponent(suggestionQuery)}`);
    
    hapticFeedback.medium();
    closeHeaderSearch();
    config.onNavigate?.();
    
    logger.debug('Suggestion selected', {
      componentName: 'useSearchUI',
      operationName: 'handleSuggestionSelect',
      metadata: { suggestion: suggestionQuery, originalQuery: query }
    });
  }, [query, navigate, closeHeaderSearch, config.onNavigate]);
  
  const handleResultClick = useCallback((
    result: { link: string; id: string; type: string },
    resultCount: number
  ) => {
    // Track the search
    searchSuggestionsService.trackSearch(query, resultCount, result.type);
    
    // Navigate to the result
    navigate(result.link);
    
    hapticFeedback.medium();
    closeHeaderSearch();
    config.onNavigate?.();
    
    logger.debug('Result clicked', {
      componentName: 'useSearchUI',
      operationName: 'handleResultClick',
      metadata: { resultId: result.id, resultType: result.type, query }
    });
  }, [query, navigate, closeHeaderSearch, config.onNavigate]);
  
  const handleViewAllResults = useCallback((resultCount: number) => {
    handleSubmit(resultCount);
  }, [handleSubmit]);
  
  // Modal handlers
  const close = useCallback(() => {
    setIsOpen(false);
    closeHeaderSearch();
    config.onClose?.();
  }, [closeHeaderSearch, config.onClose]);
  
  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);
  
  return {
    // Input state
    query,
    debouncedQuery,
    isValid,
    inputRef,
    
    // Keyboard navigation
    selectedIndex,
    setSelectedIndex,
    resetSelection,
    
    // Input actions
    handleInputChange,
    handleClear,
    focus,
    blur,
    
    // Navigation actions
    handleSubmit,
    handleSuggestionSelect,
    handleResultClick,
    handleViewAllResults,
    
    // Modal state
    isOpen,
    close,
  };
}
