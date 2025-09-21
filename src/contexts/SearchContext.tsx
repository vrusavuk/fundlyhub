/**
 * Global Search Context for unified search across the application
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SearchContextType {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  navigateWithSearch: (query: string) => void;
  shouldUseIntegratedSearch: () => boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle search query from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('search');
    if (queryParam && queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }
      // Escape to close search
      if (event.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const openSearch = (initialQuery?: string) => {
    // Check if we should use integrated search instead of modal
    if (shouldUseIntegratedSearch()) {
      // Focus the integrated search input instead of opening modal
      const searchInput = document.querySelector('input[placeholder*="Search campaigns"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        if (initialQuery) {
          searchInput.value = initialQuery;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      return;
    }
    
    setIsSearchOpen(true);
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  const navigateWithSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Determine the best target based on current route
    const currentPath = location.pathname;
    
    if (currentPath === '/campaigns' || currentPath.startsWith('/fundraiser/')) {
      // Already on campaigns or fundraiser page, just update query
      navigate(`/campaigns?search=${encodeURIComponent(query)}`);
    } else {
      // Navigate to campaigns with search
      navigate(`/campaigns?search=${encodeURIComponent(query)}`);
    }
    
    closeSearch();
  };

  const shouldUseIntegratedSearch = () => {
    return location.pathname === '/campaigns';
  };

  const value = {
    isSearchOpen,
    searchQuery,
    searchResults,
    isSearching,
    openSearch,
    closeSearch,
    setSearchQuery,
    navigateWithSearch,
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