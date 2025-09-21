/**
 * Provider component for search highlighting context
 * Manages highlighting configuration and provides it to child components
 */
import { createContext, useContext, ReactNode } from 'react';

interface SearchHighlightContextType {
  searchQuery: string;
  caseSensitive?: boolean;
  highlightClassName?: string;
}

interface SearchHighlightProviderProps {
  children: ReactNode;
  searchQuery: string;
  caseSensitive?: boolean;
  highlightClassName?: string;
}

const SearchHighlightContext = createContext<SearchHighlightContextType | null>(null);

/**
 * Provider that supplies search highlighting configuration to descendant components
 */
export function SearchHighlightProvider({
  children,
  searchQuery,
  caseSensitive = false,
  highlightClassName = 'search-highlight',
}: SearchHighlightProviderProps) {
  const value = {
    searchQuery,
    caseSensitive,
    highlightClassName,
  };

  return (
    <SearchHighlightContext.Provider value={value}>
      {children}
    </SearchHighlightContext.Provider>
  );
}

/**
 * Hook to access search highlighting context
 */
export function useSearchHighlightContext() {
  const context = useContext(SearchHighlightContext);
  
  if (!context) {
    throw new Error('useSearchHighlightContext must be used within a SearchHighlightProvider');
  }
  
  return context;
}

/**
 * Hook that safely accesses search highlighting context (returns null if not available)
 */
export function useOptionalSearchHighlightContext() {
  return useContext(SearchHighlightContext);
}