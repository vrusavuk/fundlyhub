/**
 * Dynamic table of contents component for documentation pages
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    // Extract headings from the document
    const extractHeadings = () => {
      const headings = Array.from(document.querySelectorAll('h1, h2'));
      const existingIds = new Set<string>();

      const items: TocItem[] = headings.map((heading) => {
        const text = heading.textContent?.trim() || '';
        const level = parseInt(heading.tagName.charAt(1));

        // Get or generate ID
        let id = heading.getAttribute('id');
        if (!id && text) {
          id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') 
            .replace(/\s+/g, '-') 
            .trim();
          
          // Ensure uniqueness
          let uniqueId = id;
          let counter = 1;
          while (existingIds.has(uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
          }
          
          heading.setAttribute('id', uniqueId);
          id = uniqueId;
        }

        if (id) {
          existingIds.add(id);
        }

        return { id: id || '', text, level };
      }).filter(item => item.id && item.text);

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
          rootMargin: '-100px 0px -80% 0px',
          threshold: 0
        }
      );

      headings.forEach((heading) => {
        if (heading.id) {
          observer.observe(heading);
        }
      });

      return () => observer.disconnect();
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(extractHeadings, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

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

  if (tocItems.length === 0) {
    return (
      <div className="bg-background border border-border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
      <nav className="space-y-1">
        {tocItems.map((item) => {
          const isActive = activeId === item.id;
          const indent = (item.level - 1) * 12; // 12px per level
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`
                block w-full text-left text-xs transition-colors
                hover:text-foreground
                ${isActive 
                  ? 'text-primary font-medium' 
                  : 'text-muted-foreground'
                }
              `}
              style={{ paddingLeft: `${indent}px` }}
            >
              {item.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
}