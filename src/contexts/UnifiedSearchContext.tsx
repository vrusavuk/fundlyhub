/**
 * Unified Search Context - Consolidates SearchContext + EnhancedSearchContext
 * Provides optimal state management with backward compatibility
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface SearchState {
  isHeaderSearchOpen: boolean;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastSearchTimestamp: number | null;
}

type SearchAction =
  | { type: 'OPEN_HEADER_SEARCH' }
  | { type: 'CLOSE_HEADER_SEARCH' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

interface SearchContextType {
  // State
  isHeaderSearchOpen: boolean;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastSearchTimestamp: number | null;
  
  // Actions
  openHeaderSearch: () => void;
  closeHeaderSearch: () => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  shouldUseIntegratedSearch: () => boolean;
}

const initialState: SearchState = {
  isHeaderSearchOpen: false,
  searchQuery: '',
  isLoading: false,
  error: null,
  lastSearchTimestamp: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'OPEN_HEADER_SEARCH':
      return {
        ...state,
        isHeaderSearchOpen: true,
        error: null,
      };
    case 'CLOSE_HEADER_SEARCH':
      return {
        ...state,
        isHeaderSearchOpen: false,
      };
    case 'SET_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        error: null,
        lastSearchTimestamp: Date.now(),
      };
    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchQuery: '',
        error: null,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

const UnifiedSearchContext = createContext<SearchContextType | undefined>(undefined);

export function UnifiedSearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const location = useLocation();

  // Clear search when navigating away from search-enabled pages
  useEffect(() => {
    const isSearchEnabledPage = location.pathname === '/campaigns' || location.pathname === '/search';
    if (!isSearchEnabledPage && state.searchQuery) {
      dispatch({ type: 'CLEAR_SEARCH' });
    }
  }, [location.pathname, state.searchQuery]);

  // Memoized functions for better performance
  const shouldUseIntegratedSearch = useCallback(() => {
    return location.pathname === '/campaigns' || location.pathname === '/search';
  }, [location.pathname]);

  const openHeaderSearch = useCallback(() => {
    // If we're on a page that uses integrated search, focus the search input instead
    const isDemoMode = document.querySelector('[data-onboarding-active]') !== null;
    
    if (!isDemoMode && shouldUseIntegratedSearch()) {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        return;
      }
    }
    
    dispatch({ type: 'OPEN_HEADER_SEARCH' });
  }, [shouldUseIntegratedSearch]);

  const closeHeaderSearch = useCallback(() => {
    dispatch({ type: 'CLOSE_HEADER_SEARCH' });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openHeaderSearch();
      }
      // Escape to close search
      if (event.key === 'Escape' && state.isHeaderSearchOpen) {
        closeHeaderSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isHeaderSearchOpen, openHeaderSearch, closeHeaderSearch]);

  // Listen for custom event to force open header search (for onboarding)
  useEffect(() => {
    const handleForceOpen = () => {
      dispatch({ type: 'OPEN_HEADER_SEARCH' });
    };

    document.addEventListener('open-header-search', handleForceOpen);
    return () => document.removeEventListener('open-header-search', handleForceOpen);
  }, []);

  const value: SearchContextType = {
    ...state,
    openHeaderSearch,
    closeHeaderSearch,
    setSearchQuery,
    clearSearch,
    setLoading,
    setError,
    resetState,
    shouldUseIntegratedSearch,
  };

  return (
    <UnifiedSearchContext.Provider value={value}>
      {children}
    </UnifiedSearchContext.Provider>
  );
}

export function useUnifiedSearch() {
  const context = useContext(UnifiedSearchContext);
  if (context === undefined) {
    throw new Error('useUnifiedSearch must be used within a UnifiedSearchProvider');
  }
  return context;
}

// Backward compatibility exports
export const useGlobalSearch = useUnifiedSearch;
export const useEnhancedSearch = useUnifiedSearch;

// Legacy exports for smooth transition
export const SearchProvider = UnifiedSearchProvider;
export const EnhancedSearchProvider = UnifiedSearchProvider;