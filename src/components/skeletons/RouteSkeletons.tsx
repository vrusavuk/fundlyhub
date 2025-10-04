/**
 * Route-Level Skeleton Components
 * Page-specific loading states that match actual layouts
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { FundraiserCardSkeleton } from './FundraiserCardSkeleton';

/**
 * Campaigns Page Skeleton
 * Matches AllCampaigns.tsx layout structure
 */
export function CampaignsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b bg-muted/30">
        <div className="container py-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FundraiserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Page Skeleton
 * Matches UserProfile.tsx layout
 */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container py-12">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
              <div className="flex gap-6 mt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="container">
          <div className="flex gap-8">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <FundraiserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Organization Profile Skeleton
 * Similar to ProfilePageSkeleton but with org-specific elements
 */
export function OrganizationPageSkeleton() {
  return <ProfilePageSkeleton />;
}

/**
 * Fundly Give Page Skeleton
 */
export function FundlyGivePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * API Docs Skeleton
 */
export function ApiDocsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </aside>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Fundraiser Skeleton
 */
export function CreateFundraiserPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-96 mb-8" />
          <Card>
            <CardContent className="p-8 space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between pt-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
