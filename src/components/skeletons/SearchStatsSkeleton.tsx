/**
 * Search stats skeleton loading state
 * Displays skeleton for search results statistics
 */
import { Skeleton } from "@/components/ui/enhanced-skeleton";

interface SearchStatsSkeletonProps {
  className?: string;
  showCount?: boolean;
  showStats?: boolean;
}

export function SearchStatsSkeleton({ 
  className = "flex items-center gap-4", 
  showCount = true,
  showStats = true 
}: SearchStatsSkeletonProps) {
  return (
    <div className={className}>
      {showCount && <Skeleton className="h-4 w-32" />}
      
      {showStats && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}
    </div>
  );
}