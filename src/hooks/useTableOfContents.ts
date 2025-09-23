/**
 * Advanced table of contents hook with best practices
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useMutationObserver } from './useMutationObserver';
import { 
  TocItem, 
  extractHeadings, 
  scrollToHeading as utilScrollToHeading,
  debounce 
} from '@/lib/utils/headingUtils';

interface UseTableOfContentsOptions {
  headingSelector?: string;
  containerSelector?: string;
  scrollOffset?: number;
  debounceDelay?: number;
}

interface UseTableOfContentsReturn {
  tocItems: TocItem[];
  activeId: string;
  scrollToHeading: (id: string) => boolean;
  isLoading: boolean;
}

export function useTableOfContents(
  options: UseTableOfContentsOptions = {}
): UseTableOfContentsReturn {
  const {
    headingSelector = 'h1, h2',
    containerSelector,
    scrollOffset = 100,
    debounceDelay = 150,
  } = options;

  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Memoized scroll function
  const scrollToHeading = useCallback(
    (id: string): boolean => {
      const success = utilScrollToHeading(id, scrollOffset);
      if (success) {
        setActiveId(id);
      }
      return success;
    },
    [scrollOffset]
  );

  // Handle intersection observer entries
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Find the topmost visible heading
    const visibleEntries = entries.filter(entry => entry.isIntersecting);
    
    if (visibleEntries.length > 0) {
      // Sort by position on screen (topmost first)
      const sortedEntries = visibleEntries.sort(
        (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
      );
      
      const topEntry = sortedEntries[0];
      if (topEntry.target.id) {
        setActiveId(topEntry.target.id);
      }
    }
  }, []);

  // Set up intersection observer
  const { observe, unobserve, disconnect } = useIntersectionObserver(
    handleIntersection,
    {
      rootMargin: '-100px 0px -80% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  // Debounced heading extraction
  const debouncedExtractHeadings = useMemo(
    () => debounce(() => {
      try {
        setIsLoading(true);
        const headings = extractHeadings(headingSelector, containerSelector);
        setTocItems(headings);

        // Set up intersection observer for new headings
        headings.forEach(({ element }) => {
          if (element.id) {
            observe(element);
          }
        });

        // Set initial active heading if none is set
        if (headings.length > 0 && !activeId) {
          setActiveId(headings[0].id);
        }
      } catch (error) {
        console.warn('Error extracting headings:', error);
        setTocItems([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceDelay),
    [headingSelector, containerSelector, debounceDelay, observe, activeId]
  );

  // Handle DOM mutations (for dynamic content)
  const handleMutation = useCallback((mutations: MutationRecord[]) => {
    const hasRelevantChanges = mutations.some(mutation => 
      mutation.type === 'childList' && 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).matches(headingSelector)
      )
    );

    if (hasRelevantChanges) {
      debouncedExtractHeadings();
    }
  }, [headingSelector, debouncedExtractHeadings]);

  // Set up mutation observer for dynamic content
  const container = containerSelector ? document.querySelector(containerSelector) : document.body;
  useMutationObserver(handleMutation, container, {
    childList: true,
    subtree: true,
  });

  // Extract headings on mount and route change
  useEffect(() => {
    // Cleanup previous observations
    disconnect();
    setActiveId('');
    
    // Small delay to ensure DOM is ready after route change
    const timeoutId = setTimeout(() => {
      debouncedExtractHeadings();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      disconnect();
    };
  }, [location.pathname, disconnect, debouncedExtractHeadings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    tocItems,
    activeId,
    scrollToHeading,
    isLoading,
  };
}