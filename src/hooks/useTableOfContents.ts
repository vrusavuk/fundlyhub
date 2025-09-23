/**
 * Hook for generating and managing dynamic table of contents
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function useTableOfContents() {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    // Generate IDs and extract headings (only h1 and h2)
    const headings = Array.from(document.querySelectorAll('h1, h2'));
    
    const items: TocItem[] = headings.map((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      
      // Generate ID if not present
      let id = heading.getAttribute('id');
      if (!id) {
        id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .trim();
        
        // Ensure uniqueness
        const existingIds = headings.slice(0, index).map(h => h.getAttribute('id')).filter(Boolean);
        let uniqueId = id;
        let counter = 1;
        while (existingIds.includes(uniqueId)) {
          uniqueId = `${id}-${counter}`;
          counter++;
        }
        
        heading.setAttribute('id', uniqueId);
        id = uniqueId;
      }
      
      return { id, text, level };
    });

    setTocItems(items);

    // Set up intersection observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px', // Trigger when heading is near top
        threshold: 0
      }
    );

    headings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [location.pathname]); // Re-run when route changes

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setActiveId(id);
    }
  };

  return { tocItems, activeId, scrollToHeading };
}