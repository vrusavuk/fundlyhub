/**
 * Enhanced loading states with shimmer effects and content-aware variants
 */
import { LoadingSpinner } from './LoadingSpinner';
import { Skeleton, SkeletonText, SkeletonImage, SkeletonAvatar } from '@/components/ui/enhanced-skeleton';
import { FundraiserCardSkeleton } from '@/components/skeletons/FundraiserCardSkeleton';
import { ActivityItemSkeleton } from '@/components/skeletons/ActivityItemSkeleton';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'cards' | 'table' | 'fundraiser-cards' | 'activity-items';
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  className?: string;
}

export function LoadingState({ 
  variant = 'spinner', 
  size = 'md', 
  count = 3,
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  };

  switch (variant) {
    case 'spinner':
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <LoadingSpinner size={size} />
        </div>
      );

    case 'skeleton':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className={`w-full ${sizeClasses[size]}`} />
          ))}
        </div>
      );

    case 'fundraiser-cards':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <FundraiserCardSkeleton 
              key={i} 
              className="animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      );

    case 'activity-items':
      return (
        <div className={`space-y-1 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <ActivityItemSkeleton 
              key={i}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      );

    case 'cards':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <SkeletonImage aspectRatio="16/9" className="h-48" />
              <SkeletonText lines={2} widths={['80%', '60%']} />
              <div className="flex items-center gap-2">
                <SkeletonAvatar size="sm" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex space-x-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}