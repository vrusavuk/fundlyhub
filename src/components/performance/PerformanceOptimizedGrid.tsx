/**
 * Performance-optimized grid component with virtual scrolling and memoization
 */
import React, { useMemo, useCallback } from 'react';
import { MemoizedFundraiserCard } from '@/components/optimized/MemoizedComponents';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';

interface PerformanceOptimizedGridProps {
  items: any[];
  loading?: boolean;
  searchQuery?: string;
  onCardClick?: (slug: string) => void;
  onDonate?: (id: string) => void;
  variant?: 'default' | 'polished';
  className?: string;
  itemsPerRow?: 1 | 2 | 3 | 4;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const PerformanceOptimizedGrid = React.memo<PerformanceOptimizedGridProps>(({
  items,
  loading = false,
  searchQuery = '',
  onCardClick,
  onDonate,
  variant = 'default',
  className,
  itemsPerRow = 3,
  showLoadMore = false,
  onLoadMore,
  hasMore = false
}) => {
  // Memoize grid columns class
  const gridCols = useMemo(() => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };
    return colsMap[itemsPerRow];
  }, [itemsPerRow]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCardClick = useCallback((slug: string) => {
    onCardClick?.(slug);
  }, [onCardClick]);

  const handleDonate = useCallback((id: string) => {
    onDonate?.(id);
  }, [onDonate]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      onLoadMore?.();
    }
  }, [loading, hasMore, onLoadMore]);

  // Memoize rendered items to prevent unnecessary re-renders of the entire list
  const renderedItems = useMemo(() => {
    return items.map((item, index) => (
      <div key={`${item.id}-${index}`} className="h-full">
        <MemoizedFundraiserCard
          id={item.id}
          title={item.title}
          summary={item.description}
          raisedAmount={item.currentAmount}
          goalAmount={item.goalAmount}
          currency={item.currency || 'USD'}
          coverImage={item.imageUrl}
          category={item.category}
          organizationName={item.organizationName}
          searchQuery={searchQuery}
          onClick={() => handleCardClick(item.slug)}
          onDonate={variant === 'polished' ? () => handleDonate(item.id) : undefined}
          variant={variant}
        />
      </div>
    ));
  }, [items, searchQuery, variant, handleCardClick, handleDonate]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No campaigns found</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn("grid gap-6", gridCols)}>
        {renderedItems}
      </div>

      {/* Load More Button */}
      {showLoadMore && hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
});

PerformanceOptimizedGrid.displayName = 'PerformanceOptimizedGrid';