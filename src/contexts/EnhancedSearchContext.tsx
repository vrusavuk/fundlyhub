/**
 * Enhanced Search Context with improved state management
 * Replaces the original SearchContext with better architecture
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

interface SearchContextType extends SearchState {
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

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function EnhancedSearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const location = useLocation();
  const navigate = useNavigate();

  // Clear search when navigating away from search-enabled pages
  useEffect(() => {
    const isSearchEnabledPage = location.pathname === '/campaigns' || location.pathname === '/search';
    if (!isSearchEnabledPage && state.searchQuery) {
      dispatch({ type: 'CLEAR_SEARCH' });
    }
  }, [location.pathname, state.searchQuery]);

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
  }, [state.isHeaderSearchOpen]);

  const shouldUseIntegratedSearch = () => {
    return location.pathname === '/campaigns' || location.pathname === '/search';
  };

  const openHeaderSearch = () => {
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
  };

  // Listen for custom event to force open header search (for onboarding)
  useEffect(() => {
    const handleForceOpen = () => {
      dispatch({ type: 'OPEN_HEADER_SEARCH' });
    };

    document.addEventListener('open-header-search', handleForceOpen);
    return () => document.removeEventListener('open-header-search', handleForceOpen);
  }, []);

  const closeHeaderSearch = () => {
    dispatch({ type: 'CLOSE_HEADER_SEARCH' });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

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
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useEnhancedSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useEnhancedSearch must be used within an EnhancedSearchProvider');
  }
  return context;
}

// Compatibility export for existing code
export const useGlobalSearch = useEnhancedSearch;