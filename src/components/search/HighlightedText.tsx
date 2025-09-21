/**
 * Component for displaying text with search term highlighting
 * Provides consistent highlighting behavior across the application
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useSearchHighlight } from '@/hooks/useSearchHighlight';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  caseSensitive?: boolean;
  fallback?: string;
}

/**
 * Displays text with highlighted search matches
 * Falls back to original text if no search query is provided
 */
export const HighlightedText = memo<HighlightedTextProps>(({
  text,
  searchQuery,
  className,
  as: Component = 'span',
  caseSensitive = false,
  fallback = '',
}) => {
  const { highlightText } = useSearchHighlight({ 
    query: searchQuery || '', 
    caseSensitive 
  });
  
  const displayText = text || fallback;
  
  // If no search query, render plain text
  if (!searchQuery || !displayText) {
    return <Component className={className}>{displayText}</Component>;
  }
  
  const highlightedContent = highlightText(displayText);
  
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
    />
  );
});

HighlightedText.displayName = 'HighlightedText';

/**
 * Specialized component for highlighting titles
 */
export const HighlightedTitle = memo<Omit<HighlightedTextProps, 'as'>>(({ 
  className, 
  ...props 
}) => (
  <HighlightedText 
    {...props}
    as="h3"
    className={cn("font-semibold", className)}
  />
));

HighlightedTitle.displayName = 'HighlightedTitle';

/**
 * Specialized component for highlighting descriptions/summaries
 */
export const HighlightedDescription = memo<Omit<HighlightedTextProps, 'as'>>(({ 
  className, 
  ...props 
}) => (
  <HighlightedText 
    {...props}
    as="p"
    className={cn("text-muted-foreground", className)}
  />
));

HighlightedDescription.displayName = 'HighlightedDescription';

/**
 * Specialized component for highlighting names/labels
 */
export const HighlightedLabel = memo<Omit<HighlightedTextProps, 'as'>>(({ 
  className, 
  ...props 
}) => (
  <HighlightedText 
    {...props}
    as="span"
    className={cn("font-medium", className)}
  />
));

HighlightedLabel.displayName = 'HighlightedLabel';