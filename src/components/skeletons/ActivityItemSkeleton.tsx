import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/enhanced-skeleton";

interface ActivityItemSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ActivityItemSkeleton({ className, style }: ActivityItemSkeletonProps) {
  return (
    <div className={`flex items-start gap-3 p-4 border-b ${className}`} style={style}>
      {/* Avatar */}
      <SkeletonAvatar size="md" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Main text */}
        <SkeletonText 
          lines={2} 
          widths={['90%', '65%']}
          className="h-4"
        />
        
        {/* Metadata */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      
      {/* Action */}
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}