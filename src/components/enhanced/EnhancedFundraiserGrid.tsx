/**
 * Enhanced fundraiser grid with polished cards and improved layout
 * Implements Phase 4 visual design improvements
 */
import React, { useState } from 'react';
import { UnifiedFundraiserCard } from '@/components/cards/UnifiedFundraiserCard';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EnhancedButton } from './EnhancedButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import type { Fundraiser } from '@/types/fundraiser';
import { 
  Grid3X3, 
  List, 
  Filter, 
  SortAsc, 
  TrendingUp,
  Star,
  Clock,
  Target
} from 'lucide-react';

interface EnhancedFundraiserGridProps {
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
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortBy?: 'newest' | 'trending' | 'amount' | 'deadline';
  onSortChange?: (sort: 'newest' | 'trending' | 'amount' | 'deadline') => void;
  showFilters?: boolean;
}

export function EnhancedFundraiserGrid({
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
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'newest',
  onSortChange,
  showFilters = true
}: EnhancedFundraiserGridProps) {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
    hapticFeedback.light();
  };

  const handleSortChange = (sort: 'newest' | 'trending' | 'amount' | 'deadline') => {
    onSortChange?.(sort);
    hapticFeedback.light();
  };

  const handleLoadMore = () => {
    onLoadMore?.();
    hapticFeedback.medium();
  };

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

  if (loading && fundraisers.length === 0) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        )}
        <LoadingState 
          variant="fundraiser-cards" 
          count={localViewMode === 'grid' ? 6 : 4}
          className={cn(
            localViewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}
        />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ErrorMessage message={error} onRetry={onRetry} />
      </Card>
    );
  }

  if (fundraisers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="heading-small text-muted-foreground">No Fundraisers Found</h3>
            <p className="body-medium text-muted-foreground max-w-md mx-auto">
              {emptyMessage}
            </p>
          </div>
          {onRetry && (
            <EnhancedButton
              variant="outline"
              onClick={onRetry}
              icon="arrow"
              className="mt-4"
            >
              Try Again
            </EnhancedButton>
          )}
        </div>
      </Card>
    );
  }

  const featuredFundraisers = getFeaturedFundraisers();
  const trendingFundraisers = getTrendingFundraisers();

  return (
    <div className="space-y-8">
      {/* Filter and View Controls */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">
                {fundraisers.length} fundraiser{fundraisers.length !== 1 ? 's' : ''}
              </Badge>
              {searchQuery && (
                <Badge variant="secondary" className="font-medium">
                  Results for "{searchQuery}"
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Options */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <EnhancedButton
                  variant={sortBy === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortChange('newest')}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Newest
                </EnhancedButton>
                <EnhancedButton
                  variant={sortBy === 'trending' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortChange('trending')}
                  className="text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </EnhancedButton>
                <EnhancedButton
                  variant={sortBy === 'amount' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortChange('amount')}
                  className="text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Amount
                </EnhancedButton>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <EnhancedButton
                  variant={localViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </EnhancedButton>
                <EnhancedButton
                  variant={localViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </EnhancedButton>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Fundraiser Grid/List */}
      <div className={cn(
        "section-hierarchy",
        localViewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-6'
      )}>
        {fundraisers.map((fundraiser, index) => {
          const fundraiserStats = stats[fundraiser.id] || {};
          const isFeatured = featuredFundraisers.includes(fundraiser);
          const isTrending = trendingFundraisers.includes(fundraiser);
          
          return (
            <UnifiedFundraiserCard
              key={fundraiser.id}
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
              isFeatured={isFeatured}
              isTrending={isTrending}
              trustScore={85 + Math.floor(Math.random() * 15)} // Mock trust score
              searchQuery={searchQuery}
              onClick={() => onCardClick(fundraiser.slug)}
              onDonate={() => {
                // Handle donate action
                console.log('Donate to:', fundraiser.id);
              }}
              variant="polished"
            />
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <EnhancedButton
            variant="outline"
            prominence="primary"
            icon="arrow"
            onClick={handleLoadMore}
            loading={loading}
            loadingText="Loading more..."
            className="min-w-[200px]"
          >
            Load More Campaigns
          </EnhancedButton>
        </div>
      )}

      {/* Stats Summary */}
      {fundraisers.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="component-hierarchy">
              <div className="text-2xl font-bold text-primary">
                {fundraisers.length}
              </div>
              <div className="caption-medium text-muted-foreground">
                Active Campaigns
              </div>
            </div>
            
            <div className="component-hierarchy">
              <div className="text-2xl font-bold text-success">
                {featuredFundraisers.length}
              </div>
              <div className="caption-medium text-muted-foreground">
                Featured
              </div>
            </div>
            
            <div className="component-hierarchy">
              <div className="text-2xl font-bold text-accent">
                {trendingFundraisers.length}
              </div>
              <div className="caption-medium text-muted-foreground">
                Trending
              </div>
            </div>
            
            <div className="component-hierarchy">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(
                  fundraisers.reduce((sum, f) => {
                    const fStats = stats[f.id] || {};
                    return sum + ((fStats.totalRaised || 0) / f.goal_amount) * 100;
                  }, 0) / fundraisers.length
                )}%
              </div>
              <div className="caption-medium text-muted-foreground">
                Avg. Funded
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}