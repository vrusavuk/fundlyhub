/**
 * Search results container component
 * Handles different layouts and states for search results with proper skeleton loading
 */
import { memo } from 'react';
import { SearchResultItem } from './SearchResultItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
import { SearchResultSkeleton, SKELETON_COUNTS } from '@/components/skeletons';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'campaign' | 'user' | 'organization';
  title: string;
  subtitle?: string;
  image?: string;
  snippet?: string;
  link: string;
  relevanceScore?: number;
}

interface SearchResultsContainerProps {
  results: SearchResult[];
  searchQuery: string;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  variant?: 'card' | 'list' | 'compact';
  emptyMessage?: string;
  className?: string;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onResultClick?: (result: SearchResult) => void;
}

export const SearchResultsContainer = memo<SearchResultsContainerProps>(({
  results,
  searchQuery,
  loading = false,
  error = null,
  hasMore = false,
  variant = 'card',
  emptyMessage = 'No results found',
  className,
  onLoadMore,
  onRetry,
  onResultClick
}) => {
  // Initial loading state with skeleton
  if (loading && results.length === 0) {
    return (
      <div className="space-y-4">
        <ScreenReaderOnly>Loading search results, please wait...</ScreenReaderOnly>
        <div role="status" aria-label="Loading search results">
          <div className={cn(
            variant === 'card' ? 'space-y-4' : 'divide-y divide-border'
          )}>
        {Array.from({ length: SKELETON_COUNTS.SEARCH_RESULTS }).map((_, index) => (
          <SearchResultSkeleton
            key={index}
            variant={variant === 'compact' ? 'compact' : variant}
            className={cn(
              variant === 'list' && 'py-3 first:pt-0 last:pb-0',
              className
            )}
          />
        ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const containerClassName = variant === 'compact' 
    ? 'divide-y divide-border'
    : 'space-y-4';

  return (
    <div className={className}>
      <div className={containerClassName}>
        {results.map((result, index) => (
          <SearchResultItem
            key={`${result.type}-${result.id}-${index}`}
            result={result}
            searchQuery={searchQuery}
            variant={variant}
            onClick={() => onResultClick?.(result)}
          />
        ))}
      </div>
      
      {hasMore && onLoadMore && (
        <div className="text-center py-6">
          <Button 
            onClick={onLoadMore} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <LoadingSpinner className="mr-2" /> : null}
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
});

SearchResultsContainer.displayName = 'SearchResultsContainer';