import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from "@/components/ui/enhanced-skeleton";

interface ProfileHeaderSkeletonProps {
  className?: string;
}

export function ProfileHeaderSkeleton({ className }: ProfileHeaderSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cover Image */}
      <div className="relative">
        <Skeleton className="h-48 w-full rounded-lg" />
        
        {/* Profile Avatar */}
        <div className="absolute -bottom-16 left-6">
          <SkeletonAvatar size="lg" className="h-32 w-32 border-4 border-background" />
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="pt-16 px-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <SkeletonButton size="md" />
            <SkeletonButton size="md" />
          </div>
        </div>
        
        {/* Bio */}
        <div className="mb-6">
          <SkeletonText 
            lines={3} 
            widths={['100%', '85%', '60%']}
            className="h-4"
          />
        </div>
        
        {/* Stats */}
        <div className="flex gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-12 mb-1 mx-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}