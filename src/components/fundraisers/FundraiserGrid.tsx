/**
 * Grid component for displaying fundraiser cards with loading and error states
 */
import { EnhancedFundraiserCard } from '@/components/EnhancedFundraiserCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/ui/button';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (fundraisers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundraisers.map((fundraiser, index) => {
          const fundraiserStats = stats[fundraiser.id];
          
          return (
            <EnhancedFundraiserCard
              key={fundraiser.id}
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
          );
        })}
      </div>

      {hasMore && onLoadMore && (
        <div className="text-center mt-8">
          <Button 
            onClick={onLoadMore} 
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More Campaigns'
            )}
          </Button>
        </div>
      )}
    </>
  );
}