/**
 * Performance-optimized skeleton loading components
 * Provides better UX during data loading states
 */
import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton = memo<SkeletonProps>(({ 
  className, 
  width, 
  height, 
  rounded = false 
}) => (
  <div
    className={`animate-pulse bg-muted ${rounded ? 'rounded-full' : 'rounded'} ${className || ''}`}
    style={{ width, height }}
  />
));

Skeleton.displayName = 'Skeleton';

// Fundraiser card skeleton
export const FundraiserCardSkeleton = memo(() => (
  <div className="border rounded-lg overflow-hidden">
    <Skeleton height={192} className="w-full" />
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton width={32} height={32} rounded />
        <div className="flex-1">
          <Skeleton height={16} className="w-24 mb-1" />
          <Skeleton height={12} className="w-32" />
        </div>
      </div>
      
      <div>
        <Skeleton height={20} className="w-full mb-2" />
        <Skeleton height={16} className="w-3/4 mb-1" />
        <Skeleton height={16} className="w-1/2" />
      </div>
      
      <div className="space-y-3">
        <Skeleton height={8} className="w-full" />
        <div className="flex justify-between">
          <div>
            <Skeleton height={18} className="w-20 mb-1" />
            <Skeleton height={12} className="w-24" />
          </div>
          <div className="text-right">
            <Skeleton height={16} className="w-12 mb-1" />
            <Skeleton height={12} className="w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
));

FundraiserCardSkeleton.displayName = 'FundraiserCardSkeleton';

// Search result skeleton
export const SearchResultSkeleton = memo(() => (
  <div className="p-6 border rounded-lg">
    <div className="flex items-start gap-4">
      <Skeleton width={48} height={48} rounded />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton width={60} height={20} rounded />
          <Skeleton width={40} height={12} />
        </div>
        <Skeleton height={20} className="w-3/4 mb-2" />
        <Skeleton height={16} className="w-1/2 mb-2" />
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-2/3" />
      </div>
    </div>
  </div>
));

SearchResultSkeleton.displayName = 'SearchResultSkeleton';

// Navigation skeleton
export const NavigationSkeleton = memo(() => (
  <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Skeleton width={150} height={32} />
        <div className="hidden md:flex items-center space-x-6">
          <Skeleton width={80} height={16} />
          <Skeleton width={90} height={16} />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton width={32} height={32} rounded />
          <Skeleton width={120} height={32} />
          <Skeleton width={32} height={32} rounded />
        </div>
      </div>
    </div>
  </nav>
));

NavigationSkeleton.displayName = 'NavigationSkeleton';