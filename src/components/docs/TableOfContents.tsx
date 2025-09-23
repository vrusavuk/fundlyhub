/**
 * Dynamic table of contents component for documentation pages
 */
import { useTableOfContents } from '@/hooks/useTableOfContents';

export function TableOfContents() {
  const { tocItems, activeId, scrollToHeading } = useTableOfContents();

  if (tocItems.length === 0) {
    return (
      <div className="bg-background border border-border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
        <div className="text-xs text-muted-foreground">No headings found</div>
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