/**
 * Campaign/fundraiser detail page skeleton
 */
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from '@/components/ui/enhanced-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CampaignPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8" role="status" aria-label="Loading campaign details">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Header */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" /> {/* Title */}
            <div className="flex items-center gap-4">
              <SkeletonAvatar size="sm" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Campaign Image */}
          <Skeleton className="w-full aspect-video rounded-lg" />

          {/* Campaign Description */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" /> {/* Story heading */}
            <SkeletonText lines={8} widths={['100%', '95%', '90%', '100%', '85%', '100%', '92%', '88%']} />
          </div>

          {/* Updates Section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border-b pb-4">
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-20 mb-3" />
                  <SkeletonText lines={3} widths={['100%', '95%', '80%']} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Donation Sidebar */}
        <div className="space-y-6">
          {/* Donation Widget */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-32" /> {/* Raised amount */}
              <Skeleton className="h-2 w-full" /> {/* Progress bar */}
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <Skeleton className="h-12 w-full" />
              <SkeletonButton className="w-full h-12" />
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <SkeletonAvatar size="sm" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
              <SkeletonButton size="sm" className="w-full mt-4" />
            </CardContent>
          </Card>

          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <SkeletonAvatar size="md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <SkeletonText lines={2} />
              <SkeletonButton size="sm" />
            </CardContent>
          </Card>
        </div>
      </div>

      <span className="sr-only">Loading campaign details...</span>
    </div>
  );
}