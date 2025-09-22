import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonText, SkeletonImage, SkeletonAvatar, SkeletonButton } from "@/components/ui/enhanced-skeleton";

interface FundraiserCardSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function FundraiserCardSkeleton({ className, style }: FundraiserCardSkeletonProps) {
  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`} style={style}>
      {/* Cover Image Skeleton */}
      <div className="relative">
        <SkeletonImage aspectRatio="16/9" className="h-48" />
        
        {/* Overlay Actions Skeleton */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Skeleton variant="button" className="h-8 w-8 rounded-full" />
          <Skeleton variant="button" className="h-8 w-8 rounded-full" />
          <Skeleton variant="button" className="h-8 w-8 rounded-full" />
        </div>

        {/* Category Badge Skeleton */}
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Urgency Badge Skeleton */}
        <div className="absolute bottom-4 left-4">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      <CardContent className="p-6">
        {/* Creator Info Skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <div className="mb-3">
          <SkeletonText 
            lines={2} 
            widths={['85%', '60%']}
            className="h-5 mb-1"
          />
        </div>

        {/* Description Skeleton */}
        <div className="mb-4">
          <SkeletonText 
            lines={2} 
            widths={['100%', '75%']}
            className="h-4"
          />
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-4">
          <div className="relative">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="absolute top-0 left-0 h-2 w-3/5 rounded-full bg-primary/20" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>

        {/* Bottom Stats Skeleton */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}