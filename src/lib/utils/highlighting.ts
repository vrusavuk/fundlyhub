/**
 * Utility functions for highlighting search terms in text
 */

export const normalizeQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);
};

export const highlightText = (text: string, searchTerms: string[]): string => {
  if (!text || searchTerms.length === 0) return text;
  
  let highlighted = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  
  return highlighted;
};

export const highlightSearchMatches = (text: string, searchQuery: string): string => {
  if (!searchQuery) return text;
  
  const searchTerms = normalizeQuery(searchQuery);
  return highlightText(text, searchTerms);
};