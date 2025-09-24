/**
 * Centralized loading states for search components
 * Provides consistent loading UI across all search interfaces
 */
import React from 'react';
import { SearchPageSkeleton, SearchFiltersSkeleton, SearchStatsSkeleton } from '@/components/skeletons';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

interface SearchLoadingStatesProps {
  type: 'full-page' | 'results-only' | 'filters-only' | 'stats-only' | 'spinner-only';
  showFilters?: boolean;
  showStats?: boolean;
  variant?: 'card' | 'list' | 'compact';
  className?: string;
  message?: string;
}

export function SearchLoadingStates({
  type,
  showFilters = false,
  showStats = false,
  variant = 'card',
  className,
  message = 'Loading search results...'
}: SearchLoadingStatesProps) {
  const renderContent = () => {
    switch (type) {
      case 'full-page':
        return (
          <SearchPageSkeleton
            showFilters={showFilters}
            showStats={showStats}
            variant={variant === 'compact' ? 'card' : variant}
            className={className}
          />
        );
        
      case 'filters-only':
        return <SearchFiltersSkeleton className={className} />;
        
      case 'stats-only':
        return <SearchStatsSkeleton className={className} />;
        
      case 'spinner-only':
        return (
          <div className={`flex justify-center py-12 ${className}`}>
            <LoadingSpinner />
          </div>
        );
        
      case 'results-only':
      default:
        return (
          <div className={`space-y-4 ${className}`}>
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div role="status" aria-label="Loading content">
      <ScreenReaderOnly>{message}</ScreenReaderOnly>
      {renderContent()}
    </div>
  );
}

// Convenience components for specific use cases
export const SearchFullPageLoading = (props: Omit<SearchLoadingStatesProps, 'type'>) => (
  <SearchLoadingStates type="full-page" {...props} />
);

export const SearchResultsLoading = (props: Omit<SearchLoadingStatesProps, 'type'>) => (
  <SearchLoadingStates type="results-only" {...props} />
);

export const SearchFiltersLoading = (props: Omit<SearchLoadingStatesProps, 'type'>) => (
  <SearchLoadingStates type="filters-only" {...props} />
);

export const SearchStatsLoading = (props: Omit<SearchLoadingStatesProps, 'type'>) => (
  <SearchLoadingStates type="stats-only" {...props} />
);