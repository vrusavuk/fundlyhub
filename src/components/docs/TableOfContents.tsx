/**
 * Table of contents for documentation pages
 */
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from the page
    const headingElements = document.querySelectorAll('h1, h2, h3, h4');
    const tocItems: TocItem[] = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      title: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    }));
    
    setHeadings(tocItems);

    // Set up intersection observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    headingElements.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed top-20 sm:top-24 right-0 w-56 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] border-l border-border bg-background overflow-y-auto z-20">
      <div className="pt-4 px-4 pb-4">
        <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                "block w-full text-left text-xs py-1 px-2 rounded transition-colors",
                heading.level === 2 && "ml-0",
                heading.level === 3 && "ml-3",
                heading.level === 4 && "ml-6",
                activeId === heading.id 
                  ? "text-primary bg-primary/10 border-l-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {heading.title}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}