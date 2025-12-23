/**
 * Component for displaying text with search term highlighting
 * Provides consistent highlighting behavior across the application
 */
import { memo, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { highlightSearchText } from '@/hooks/useUnifiedSearch';

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
  const displayText = text || fallback;
  
  const highlightedContent = useMemo(() => {
    if (!searchQuery || !displayText) return null;
    
    const highlighted = highlightSearchText(displayText, searchQuery, { caseSensitive });
    return DOMPurify.sanitize(highlighted, {
      ALLOWED_TAGS: ['mark'],
      ALLOWED_ATTR: ['class']
    });
  }, [displayText, searchQuery, caseSensitive]);
  
  // If no search query, render plain text
  if (!searchQuery || !displayText) {
    return <Component className={className}>{displayText}</Component>;
  }
  
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedContent || displayText }}
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