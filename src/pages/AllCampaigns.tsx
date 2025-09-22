import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { CampaignFilters } from "@/components/fundraisers/CampaignFilters";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useFundraisers } from "@/hooks/useFundraisers";
import { useCampaignStats } from "@/hooks/useCampaignStats";
import { useCategories } from "@/hooks/useCategories";
import { useGlobalSearch } from "@/contexts/SearchContext";

export default function AllCampaigns() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    location: 'All locations',
    timePeriod: 'all',
    nonprofitsOnly: false,
    closeToGoal: false
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchQuery } = useGlobalSearch();
  const campaignStats = useCampaignStats();
  const { categories } = useCategories();

  // Get initial category from URL parameters  
  const initialCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    if (initialCategory && initialCategory !== 'All') {
      setSelectedCategory(initialCategory);
      // Also set it in activeFilters for the filter component
      setActiveFilters(prev => ({
        ...prev,
        categories: [initialCategory]
      }));
    }
  }, [initialCategory]);

  const { 
    fundraisers, 
    donations, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useFundraisers({ 
    limit: 24,
    category: selectedCategory === "All" ? undefined : selectedCategory
  });

  // Refresh data when selected category changes
  useEffect(() => {
    refresh();
  }, [selectedCategory, refresh]);

  // Client-side filtering for search and additional filters (category is handled server-side)
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = activeFilters.location === 'All locations' || 
        fundraiser.location?.toLowerCase().includes(activeFilters.location.toLowerCase());
      
      // Simple time period filtering (would need actual date logic in real implementation)
      const matchesTimePeriod = activeFilters.timePeriod === 'all';
      
      return matchesSearch && matchesLocation && matchesTimePeriod;
    });
  }, [fundraisers, searchQuery, activeFilters]);

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.categories.length > 0) count++;
    if (activeFilters.location !== 'All locations') count++;
    if (activeFilters.timePeriod !== 'all') count++;
    if (activeFilters.nonprofitsOnly) count++;
    if (activeFilters.closeToGoal) count++;
    return count;
  };

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="All Campaigns"
          description="Discover and support amazing causes from around the world"
          actions={
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-end">
                <span className="font-medium text-green-600">
                  {campaignStats.loading ? '...' : campaignStats.activeCampaigns.toLocaleString()} Active
                </span>
                <span className="text-xs text-muted-foreground">campaigns</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium text-blue-600">
                  {campaignStats.loading ? '...' : campaignStats.successfulCampaigns.toLocaleString()} Closed
                </span>
                <span className="text-xs text-muted-foreground">campaigns</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium text-primary">
                  {campaignStats.loading ? '...' : `$${campaignStats.totalFundsRaised.toLocaleString()}`}
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
          donations={donations}
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