/**
 * Global Search Context for unified search across the application
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SearchContextType {
  isHeaderSearchOpen: boolean;
  searchQuery: string;
  openHeaderSearch: () => void;
  closeHeaderSearch: () => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  shouldUseIntegratedSearch: () => boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Clear search when navigating away from search-enabled pages
  useEffect(() => {
    console.log('🧭 Navigation effect - pathname:', location.pathname);
    const isSearchEnabledPage = location.pathname === '/search';
    console.log('🔍 isSearchEnabledPage:', isSearchEnabledPage);
    if (!isSearchEnabledPage && searchQuery) {
      console.log('🧹 Clearing search query');
      setSearchQuery('');
    }
  }, [location.pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openHeaderSearch();
      }
      // Escape to close search
      if (event.key === 'Escape' && isHeaderSearchOpen) {
        closeHeaderSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHeaderSearchOpen]);

  const shouldUseIntegratedSearch = () => {
    console.log('🤔 Checking shouldUseIntegratedSearch for:', location.pathname);
    // Only /search page has true integrated search, not /campaigns
    const result = location.pathname === '/search';
    console.log('✅ shouldUseIntegratedSearch result:', result);
    return result;
  };

  const openHeaderSearch = () => {
    console.log('🔍 SearchContext.openHeaderSearch called');
    console.log('🌍 Current pathname:', location.pathname);
    console.log('🎯 shouldUseIntegratedSearch():', shouldUseIntegratedSearch());
    
    // If we're on a page that uses integrated search, focus the search input instead
    // UNLESS we're in demo mode (onboarding), then always show header search
    const isDemoMode = document.querySelector('[data-onboarding-active]') !== null;
    console.log('🎭 isDemoMode:', isDemoMode);
    
    if (!isDemoMode && shouldUseIntegratedSearch()) {
      console.log('🔍 Trying to focus integrated search input...');
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      console.log('📝 Found search input:', !!searchInput);
      if (searchInput) {
        searchInput.focus();
        console.log('✅ Focused integrated search input');
        return;
      }
    }
    console.log('🚀 Opening header search modal');
    setIsHeaderSearchOpen(true);
    console.log('✅ isHeaderSearchOpen set to true');
  };

  // Listen for custom event to force open header search (for onboarding)
  useEffect(() => {
    const handleForceOpen = () => {
      setIsHeaderSearchOpen(true);
    };

    document.addEventListener('open-header-search', handleForceOpen);
    return () => document.removeEventListener('open-header-search', handleForceOpen);
  }, []);

  const closeHeaderSearch = () => {
    setIsHeaderSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const value = {
    isHeaderSearchOpen,
    searchQuery,
    openHeaderSearch,
    closeHeaderSearch,
    setSearchQuery,
    clearSearch,
    shouldUseIntegratedSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useGlobalSearch must be used within a SearchProvider');
  }
  return context;
}