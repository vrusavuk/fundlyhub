import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/enhanced-skeleton";

interface SearchResultSkeletonProps {
  className?: string;
  variant?: 'list' | 'card' | 'compact';
}

export function SearchResultSkeleton({ className, variant = 'list' }: SearchResultSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`p-4 border rounded-lg space-y-3 ${className}`}>
        <div className="flex items-start gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <SkeletonText 
              lines={2} 
              widths={['100%', '80%']}
              className="h-3"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-2 ${className}`}>
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-1/3" />
        </div>
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 p-3 border-b ${className}`}>
      <SkeletonAvatar size="sm" />
      
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}