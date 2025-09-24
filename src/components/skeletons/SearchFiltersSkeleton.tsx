/**
 * Search filters skeleton loading state
 * Displays skeleton for search page filter buttons
 */
import { Skeleton } from "@/components/ui/enhanced-skeleton";

interface SearchFiltersSkeletonProps {
  className?: string;
  count?: number;
}

export function SearchFiltersSkeleton({ 
  className = "flex gap-2 overflow-x-auto pb-2", 
  count = 4 
}: SearchFiltersSkeletonProps) {
  const filterWidths = ['w-16', 'w-20', 'w-16', 'w-24', 'w-18'];
  
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton 
          key={index}
          className={`h-9 ${filterWidths[index % filterWidths.length]} rounded-md flex-shrink-0`} 
        />
      ))}
    </div>
  );
}