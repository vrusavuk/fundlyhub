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
  shouldUseIntegratedSearch: () => boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

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
    return location.pathname === '/campaigns' || location.pathname === '/search';
  };

  const openHeaderSearch = () => {
    // If we're on a page that uses integrated search, focus the search input instead
    if (shouldUseIntegratedSearch()) {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        return;
      }
    }
    setIsHeaderSearchOpen(true);
  };

  const closeHeaderSearch = () => {
    setIsHeaderSearchOpen(false);
  };

  const value = {
    isHeaderSearchOpen,
    searchQuery,
    openHeaderSearch,
    closeHeaderSearch,
    setSearchQuery,
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