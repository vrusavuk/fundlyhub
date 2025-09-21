/**
 * Search results container component
 * Handles different layouts and states for search results
 */
import { memo } from 'react';
import { SearchResultItem } from './SearchResultItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';

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
  if (loading && results.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
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