/**
 * Hook for enhanced search highlighting with better performance and styling
 */
import { useMemo } from 'react';

interface UseSearchHighlightOptions {
  query: string;
  caseSensitive?: boolean;
  highlightClassName?: string;
}

export function useSearchHighlight({
  query,
  caseSensitive = false,
  highlightClassName = 'search-highlight'
}: UseSearchHighlightOptions) {
  
  const highlightText = useMemo(() => {
    return (text: string): string => {
      if (!query.trim() || !text) return text;
      
      const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
      if (searchTerms.length === 0) return text;
      
      let highlightedText = text;
      
      for (const term of searchTerms) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(`(${escapedTerm})`, flags);
        
        highlightedText = highlightedText.replace(
          regex,
          `<mark class="${highlightClassName}">$1</mark>`
        );
      }
      
      return highlightedText;
    };
  }, [query, caseSensitive, highlightClassName]);

  return {
    highlightText,
    hasQuery: query.trim().length > 0
  };
}