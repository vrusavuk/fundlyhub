import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { CampaignFilters } from "@/components/fundraisers/CampaignFilters";
import { useFundraisers } from "@/hooks/useFundraisers";
import { useCampaignStats } from "@/hooks/useCampaignStats";
import { useCategories } from "@/hooks/useCategories";
import { useGlobalSearch } from "@/contexts/UnifiedSearchContext";
import { useCampaignFilters } from "@/hooks/useCampaignFilters";
import { LoadingState } from "@/components/common/LoadingState";
import { ScreenReaderOnly } from "@/components/accessibility/ScreenReaderOnly";

export default function AllCampaigns() {
  const navigate = useNavigate();
  const { searchQuery } = useGlobalSearch();
  const campaignStats = useCampaignStats();
  const { categories } = useCategories();

  const { 
    fundraisers, 
    stats, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useFundraisers({ 
    limit: 24,
    category: undefined
  });

  const {
    selectedCategory,
    filteredFundraisers,
    handleFiltersChange,
    getActiveFiltersCount,
    initialCategory
  } = useCampaignFilters({
    fundraisers,
    searchQuery
  });

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <AppLayout>
      <PageContainer>
        <ScreenReaderOnly>
          <h1>All Campaigns - Browse and Support Fundraisers</h1>
        </ScreenReaderOnly>
        
        <PageHeader
          title="All Campaigns"
          description="Discover and support amazing causes from around the world"
          actions={
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-end">
                <span className="font-medium text-green-600">
                  {campaignStats.loading ? (
                    <LoadingState variant="skeleton" className="h-4 w-12" />
                  ) : (
                    campaignStats.activeCampaigns.toLocaleString()
                  )} Active
                </span>
                <span className="text-xs text-muted-foreground">campaigns</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium text-blue-600">
                  {campaignStats.loading ? (
                    <LoadingState variant="skeleton" className="h-4 w-12" />
                  ) : (
                    campaignStats.successfulCampaigns.toLocaleString()
                  )} Closed
                </span>
                <span className="text-xs text-muted-foreground">campaigns</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium text-primary">
                  {campaignStats.loading ? (
                    <LoadingState variant="skeleton" className="h-4 w-16" />
                  ) : (
                    `$${campaignStats.totalFundsRaised.toLocaleString()}`
                  )}
                </span>
                <span className="text-xs text-muted-foreground">total raised</span>
              </div>
            </div>
          }
        />

        {/* Compact Filters Section - Inside PageContainer for proper alignment */}
        <CampaignFilters
          onFiltersChange={handleFiltersChange}
          activeFiltersCount={getActiveFiltersCount()}
          initialCategory={initialCategory}
          categories={categories}
        />
      </PageContainer>
      
      {/* Campaign Grid */}
      <PageContainer>
        <FundraiserGrid
          fundraisers={filteredFundraisers}
          stats={stats}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onCardClick={handleCardClick}
          onRetry={refresh}
          searchQuery={searchQuery}
          emptyMessage={
            searchQuery || selectedCategory !== "All" 
              ? "Try adjusting your search or filters"
              : "No campaigns are currently available"
          }
        />
      </PageContainer>
    </AppLayout>
  );
}