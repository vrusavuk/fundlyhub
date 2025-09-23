/**
 * Grid component for displaying fundraiser cards with loading and error states
 */
import { EnhancedFundraiserCard } from '@/components/EnhancedFundraiserCard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingState } from '@/components/common/LoadingState';
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import type { Fundraiser } from '@/types/fundraiser';

interface FundraiserGridProps {
  fundraisers: Fundraiser[];
  stats: Record<string, any>; // Updated to use stats instead of donations
  loading: boolean;
  error: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCardClick: (slug: string) => void;
  onRetry?: () => void;
  emptyMessage?: string;
  searchQuery?: string;
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
  searchQuery
}: FundraiserGridProps) {
  // Remove the redundant useFundraiserStats hook call since stats are now passed as props
  if (loading && fundraisers.length === 0) {
    return (
      <div role="status" aria-label="Loading fundraisers">
        <ScreenReaderOnly>Loading fundraisers, please wait...</ScreenReaderOnly>
        <LoadingState variant="fundraiser-cards" count={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (fundraisers.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <p className="text-muted-foreground">{emptyMessage}</p>
        <ScreenReaderOnly>No fundraisers found matching your criteria</ScreenReaderOnly>
      </div>
    );
  }

  return (
    <>
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="grid"
        aria-label={`${fundraisers.length} fundraiser${fundraisers.length === 1 ? '' : 's'} found`}
      >
        {fundraisers.map((fundraiser, index) => {
          const fundraiserStats = stats[fundraiser.id];
          
          return (
            <div key={fundraiser.id} role="gridcell">
              <EnhancedFundraiserCard
                id={fundraiser.id}
                title={fundraiser.title}
                summary={fundraiser.summary || ""}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={fundraiserStats?.totalRaised || 0}
                currency={fundraiser.currency}
                coverImage={fundraiser.cover_image || "/placeholder.svg"}
                category={fundraiser.category || "General"}
                organizationName={fundraiser.profiles?.name || "Anonymous"}
                location={fundraiser.location || undefined}
                donorCount={fundraiserStats?.donorCount || 0}
                daysLeft={fundraiserStats?.daysLeft}
                urgency={fundraiserStats?.daysLeft && fundraiserStats.daysLeft <= 7 ? 'high' : fundraiserStats?.daysLeft && fundraiserStats.daysLeft <= 14 ? 'medium' : 'low'}
                isVerified={fundraiser.profiles?.name ? true : false}
                isOrganization={fundraiser.org_id ? true : false}
                searchQuery={searchQuery}
                onClick={() => onCardClick(fundraiser.slug)}
              />
            </div>
          );
        })}
      </div>

      {hasMore && onLoadMore && (
        <div className="text-center mt-8">
          <AccessibleButton
            onClick={onLoadMore} 
            loading={loading}
            loadingText="Loading more campaigns..."
            variant="outline"
            size="lg"
            describedBy="load-more-description"
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
    </>
  );
}