/**
 * Profile page skeleton loading state that matches the actual UI layout
 */
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from '@/components/ui/enhanced-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6" role="status" aria-label="Loading profile">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Profile Header Skeleton - Match actual ProfileHeader layout */}
      <Card className="border-0 shadow-none bg-gradient-subtle">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <SkeletonAvatar className="w-24 h-24 sm:w-32 sm:h-32" />
              <div className="text-center sm:text-left space-y-2">
                <Skeleton className="h-8 w-48" /> {/* Name */}
                <Skeleton className="h-6 w-20" /> {/* Role badge */}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              {/* Bio */}
              <SkeletonText lines={2} widths={['100%', '80%']} />

              {/* Meta Information Row */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Stats and Actions Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Stats - 4 columns like the real layout */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* Follow Button */}
                <SkeletonButton size="md" className="w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Structure - Match actual ProfileTabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="supporters" className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-18" />
          </TabsTrigger>
          <TabsTrigger value="supporting" className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-18" />
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="active">
          <ProfileTabContentSkeleton 
            title="Active Campaigns" 
            type="campaigns"
          />
        </TabsContent>
      </Tabs>

      <span className="sr-only">Loading profile information...</span>
    </div>
  );
}

// Skeleton for individual tab content
export function ProfileTabContentSkeleton({ 
  title, 
  type = "campaigns" 
}: { 
  title: string; 
  type?: "campaigns" | "followers" 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        {type === "campaigns" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProfileCampaignCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProfileFollowerItemSkeleton key={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Campaign card skeleton for profile tabs
export function ProfileCampaignCardSkeleton() {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        <Skeleton className="w-full h-full" />
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-full" />
        
        {/* Summary */}
        <SkeletonText lines={2} widths={['100%', '75%']} />
        
        {/* Organizer */}
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Follower item skeleton for profile tabs
export function ProfileFollowerItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <SkeletonButton size="sm" className="w-16" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <Card className="border-0 shadow-none bg-gradient-subtle" role="status" aria-label="Loading profile header">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center sm:items-start gap-4">
            <SkeletonAvatar className="w-24 h-24 sm:w-32 sm:h-32" />
            <div className="text-center sm:text-left space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <SkeletonText lines={2} widths={['100%', '80%']} />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <SkeletonButton size="md" className="w-24" />
            </div>
          </div>
        </div>
      </CardContent>
      <span className="sr-only">Loading profile header...</span>
    </Card>
  );
}