import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonText, SkeletonImage, SkeletonAvatar, SkeletonButton } from "@/components/ui/enhanced-skeleton";

interface FundraiserCardSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function FundraiserCardSkeleton({ className, style }: FundraiserCardSkeletonProps) {
  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg min-h-[480px] flex flex-col ${className}`} style={style}>
      {/* Cover Image Skeleton - Fixed Height */}
      <div className="relative flex-shrink-0">
        <SkeletonImage aspectRatio="16/9" className="h-48" />
        
        {/* Category Badge Skeleton */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Verification Badge Skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-grow">
        {/* Creator Info Skeleton - Fixed Height */}
        <div className="flex items-center gap-3 h-12 flex-shrink-0 mb-2">
          <SkeletonAvatar size="sm" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-12 rounded flex-shrink-0" />
        </div>

        {/* Title and Description Skeleton - Fixed Height */}
        <div className="flex-shrink-0 mb-3">
          {/* Title Area - Fixed Height */}
          <div className="h-12 mb-2">
            <SkeletonText 
              lines={2} 
              widths={['90%', '70%']}
              className="h-5 mb-1"
            />
          </div>
          
          {/* Description Area - Fixed Height */}
          <div className="h-10">
            <SkeletonText 
              lines={2} 
              widths={['100%', '80%']}
              className="h-4"
            />
          </div>
        </div>

        {/* Progress Section Skeleton - Improved spacing */}
        <div className="flex-shrink-0 space-y-4 mb-6">
          <div className="relative">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="absolute top-0 left-0 h-2 w-3/5 rounded-full bg-primary/20" />
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          
          {/* Stats Section - Natural flow without border */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* CTA Section Skeleton */}
        <div className="flex-shrink-0">
          <div className="flex gap-3">
            <Skeleton className="h-8 flex-1 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}