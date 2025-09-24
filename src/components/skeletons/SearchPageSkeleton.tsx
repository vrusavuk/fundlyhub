/**
 * Complete search page skeleton loading state
 * Provides comprehensive loading UI for search results page
 */
import { Skeleton, SkeletonText } from "@/components/ui/enhanced-skeleton";
import { SearchResultSkeleton } from "./SearchResultSkeleton";
import { SKELETON_COUNTS } from "./index";

interface SearchPageSkeletonProps {
  showFilters?: boolean;
  showStats?: boolean;
  variant?: 'list' | 'card';
  className?: string;
}

export function SearchPageSkeleton({ 
  showFilters = true,
  showStats = true,
  variant = 'card',
  className 
}: SearchPageSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Title */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" /> {/* Results count */}
              <Skeleton className="h-4 w-32" /> {/* Results text */}
            </div>
          </div>
          
          {showStats && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Buttons Skeleton */}
      {showFilters && (
        <div className="flex gap-2 pb-2 overflow-x-auto">
          <Skeleton className="h-9 w-16 rounded-md flex-shrink-0" /> {/* All */}
          <Skeleton className="h-9 w-20 rounded-md flex-shrink-0" /> {/* Campaigns */}
          <Skeleton className="h-9 w-16 rounded-md flex-shrink-0" /> {/* Users */}
          <Skeleton className="h-9 w-24 rounded-md flex-shrink-0" /> {/* Organizations */}
        </div>
      )}

      {/* Search Results Skeleton */}
      <div className="space-y-4">
        <div role="status" aria-label="Loading search results">
          <div className={variant === 'card' ? 'space-y-4' : 'divide-y divide-border'}>
            {Array.from({ length: SKELETON_COUNTS.SEARCH_RESULTS }).map((_, index) => (
              <SearchResultSkeleton
                key={index}
                variant={variant}
                className={variant === 'list' ? 'py-3 first:pt-0 last:pb-0' : ''}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Load More Button Skeleton */}
      <div className="text-center pt-4">
        <Skeleton className="h-10 w-40 rounded-md mx-auto" />
      </div>
    </div>
  );
}