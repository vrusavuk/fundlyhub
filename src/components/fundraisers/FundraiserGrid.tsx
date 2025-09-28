/**
 * Unified fundraiser grid component with enhanced features and accessibility
 * Combines the best of both previous grid implementations
 */
import { useState } from 'react';
import { UnifiedFundraiserCard } from '@/components/cards/UnifiedFundraiserCard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingState } from '@/components/common/LoadingState';
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import { GridControls, type ViewMode, type SortBy } from './GridControls';
import { GridStats } from './GridStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import { Target } from 'lucide-react';
import type { Fundraiser } from '@/types';

interface FundraiserGridProps {
  fundraisers: Fundraiser[];
  stats: Record<string, any>;
  loading: boolean;
  error: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCardClick: (slug: string) => void;
  onRetry?: () => void;
  emptyMessage?: string;
  searchQuery?: string;
  showControls?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'polished';
  initialViewMode?: ViewMode;
  initialSortBy?: SortBy;
}

export function FundraiserGrid({
  fundraisers,
  stats,
  loading,
  error,
  hasMore = false,
  onLoadMore,
  onCardClick,
  onRetry,
  emptyMessage = "No fundraisers available at the moment.",
  searchQuery,
  showControls = false,
  showStats = false,
  variant = 'default',
  initialViewMode = 'grid',
  initialSortBy = 'newest'
}: FundraiserGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);

  // Helper functions for featured/trending logic
  const getFeaturedFundraisers = () => {
    return fundraisers.filter((fundraiser, index) => {
      const fundraiserStats = stats[fundraiser.id];
      return index < 3 || // First 3 are featured
             (fundraiserStats?.totalRaised > 10000) || // High funding
             (fundraiserStats?.daysLeft && fundraiserStats.daysLeft <= 7); // Urgent
    });
  };

  const getTrendingFundraisers = () => {
    return fundraisers.filter(fundraiser => {
      const fundraiserStats = stats[fundraiser.id];
      return fundraiserStats?.donorCount > 50 || // Many donors
             ((fundraiserStats?.totalRaised / fundraiser.goal_amount) * 100) > 75; // High percentage
    });
  };

  const handleLoadMore = () => {
    onLoadMore?.();
    hapticFeedback.medium();
  };

  // Loading state
  if (loading && fundraisers.length === 0) {
    return (
      <div className="space-y-6">
        {showControls && (
          <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        )}
        <div role="status" aria-label="Loading fundraisers">
          <ScreenReaderOnly>Loading fundraisers, please wait...</ScreenReaderOnly>
          <LoadingState 
            variant="fundraiser-cards" 
            count={viewMode === 'grid' ? 6 : 4}
            className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 text-center">
        <ErrorMessage message={error} onRetry={onRetry} />
      </Card>
    );
  }

  // Empty state
  if (fundraisers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-muted-foreground">No Fundraisers Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {emptyMessage}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="mt-4"
            >
              Try Again
            </Button>
          )}
        </div>
        <ScreenReaderOnly>No fundraisers found matching your criteria</ScreenReaderOnly>
      </Card>
    );
  }

  const featuredFundraisers = getFeaturedFundraisers();
  const trendingFundraisers = getTrendingFundraisers();

  return (
    <div className="space-y-6" data-section="campaigns">
      {/* Controls */}
      {showControls && (
        <GridControls
          totalCount={fundraisers.length}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {/* Fundraiser Grid/List */}
      <div 
        className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6'
        )}
        role="grid"
        aria-label={`${fundraisers.length} fundraiser${fundraisers.length === 1 ? '' : 's'} found`}
        data-campaign-grid
      >
        {fundraisers.map((fundraiser) => {
          const fundraiserStats = stats[fundraiser.id] || {};
          const isFeatured = featuredFundraisers.includes(fundraiser);
          const isTrending = trendingFundraisers.includes(fundraiser);
          
          return (
            <div key={fundraiser.id} role="gridcell">
              <UnifiedFundraiserCard
                id={fundraiser.id}
                title={fundraiser.title}
                summary={fundraiser.summary || ""}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={fundraiserStats.totalRaised || 0}
                currency={fundraiser.currency}
                coverImage={fundraiser.cover_image || "/placeholder.svg"}
                category={fundraiser.category || "General"}
                organizationName={fundraiser.profiles?.name || "Anonymous"}
                location={fundraiser.location || undefined}
                donorCount={fundraiserStats.donorCount || 0}
                daysLeft={fundraiserStats.daysLeft}
                urgency={
                  fundraiserStats.daysLeft && fundraiserStats.daysLeft <= 7 
                    ? 'high' 
                    : fundraiserStats.daysLeft && fundraiserStats.daysLeft <= 14 
                      ? 'medium' 
                      : 'low'
                }
                isVerified={fundraiser.profiles?.name ? true : false}
                isOrganization={fundraiser.org_id ? true : false}
                isFeatured={variant === 'polished' ? isFeatured : undefined}
                isTrending={variant === 'polished' ? isTrending : undefined}
                trustScore={variant === 'polished' ? 85 + Math.floor(Math.random() * 15) : undefined}
                searchQuery={searchQuery}
                onClick={() => onCardClick(fundraiser.slug)}
                onDonate={variant === 'polished' ? () => {
                  // Handle donation
                } : undefined}
                variant={variant}
              />
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center pt-8">
          <AccessibleButton
            onClick={handleLoadMore}
            loading={loading}
            loadingText="Loading more campaigns..."
            variant="outline"
            size="lg"
            describedBy="load-more-description"
            className="min-w-[200px]"
          >
            Load More Campaigns
          </AccessibleButton>
          <ScreenReaderOnly>
            <div id="load-more-description">
              Click to load more fundraising campaigns
            </div>
          </ScreenReaderOnly>
        </div>
      )}

      {/* Stats Summary */}
      {showStats && fundraisers.length > 0 && (
        <GridStats
          fundraisers={fundraisers}
          stats={stats}
          featuredCount={featuredFundraisers.length}
          trendingCount={trendingFundraisers.length}
        />
      )}
    </div>
  );
}