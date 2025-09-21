/**
 * Custom hook for search text highlighting functionality
 * Provides consistent highlighting logic across the application
 */
import { useMemo } from 'react';

interface UseSearchHighlightOptions {
  query: string;
  caseSensitive?: boolean;
}

interface UseSearchHighlightResult {
  highlightText: (text: string) => string;
  normalizeQuery: (query: string) => string[];
  hasMatches: (text: string) => boolean;
}

/**
 * Normalizes a search query into an array of search terms
 */
const normalizeSearchQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);
};

/**
 * Highlights matching search terms in text with HTML mark tags
 */
const highlightSearchTerms = (text: string, searchTerms: string[], caseSensitive = false): string => {
  if (!text || searchTerms.length === 0) return text;
  
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
    highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  });
  
  return highlightedText;
};

/**
 * Checks if text contains any of the search terms
 */
const textContainsMatches = (text: string, searchTerms: string[], caseSensitive = false): boolean => {
  if (!text || searchTerms.length === 0) return false;
  
  const textToCheck = caseSensitive ? text : text.toLowerCase();
  
  return searchTerms.some(term => {
    const termToCheck = caseSensitive ? term : term.toLowerCase();
    return textToCheck.includes(termToCheck);
  });
};

/**
 * Hook that provides search highlighting functionality
 */
export function useSearchHighlight({ query, caseSensitive = false }: UseSearchHighlightOptions): UseSearchHighlightResult {
  const searchTerms = useMemo(() => normalizeSearchQuery(query), [query]);
  
  const highlightText = useMemo(() => 
    (text: string) => highlightSearchTerms(text, searchTerms, caseSensitive),
    [searchTerms, caseSensitive]
  );
  
  const normalizeQuery = useMemo(() => 
    (queryToNormalize: string) => normalizeSearchQuery(queryToNormalize),
    []
  );
  
  const hasMatches = useMemo(() => 
    (text: string) => textContainsMatches(text, searchTerms, caseSensitive),
    [searchTerms, caseSensitive]
  );
  
  return {
    highlightText,
    normalizeQuery,
    hasMatches,
  };
}