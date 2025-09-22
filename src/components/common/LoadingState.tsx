/**
 * Unified loading states for consistent UX
 */
import { LoadingSpinner } from './LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'cards' | 'table';
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

    case 'cards':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex space-x-4">
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