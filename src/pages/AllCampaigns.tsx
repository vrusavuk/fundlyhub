import { useState, useEffect, useMemo, useCallback } from "react";
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
import { LoadingState } from "@/components/common/LoadingState";
import { ScreenReaderOnly } from "@/components/accessibility/ScreenReaderOnly";

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
    stats, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useFundraisers({ 
    limit: 24,
    category: selectedCategory === "All" ? undefined : selectedCategory
  });

  // Remove the automatic refresh effect to prevent conflicts
  // useEffect(() => {
  //   refresh();
  // }, [selectedCategory, refresh]);

  // Enhanced filtering for both server-side and client-side
  const filteredFundraisers = useMemo(() => {
    
    const filtered = fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filtering for multiple categories (client-side)
      const matchesMultipleCategories = activeFilters.categories.length <= 1 || 
        activeFilters.categories.includes(fundraiser.category || '');
      
      const matchesLocation = activeFilters.location === 'All locations' || 
        fundraiser.location?.toLowerCase().includes(activeFilters.location.toLowerCase());
      
      // Time period filtering based on created_at
      const matchesTimePeriod = () => {
        if (activeFilters.timePeriod === 'all') return true;
        
        const createdAt = new Date(fundraiser.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        
        switch (activeFilters.timePeriod) {
          case '24h':
            return diffMs <= 24 * 60 * 60 * 1000;
          case '7d':
            return diffMs <= 7 * 24 * 60 * 60 * 1000;
          case '30d':
            return diffMs <= 30 * 24 * 60 * 60 * 1000;
          case '12m':
            return diffMs <= 365 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      };
      
      const passesAllFilters = matchesSearch && matchesMultipleCategories && matchesLocation && matchesTimePeriod();
      
      if (searchQuery && matchesSearch) {
        
      }
      
      return passesAllFilters;
    });
    
    
    return filtered;
  }, [fundraisers, searchQuery, activeFilters]);

  const handleFiltersChange = useCallback((filters: any) => {
    setActiveFilters(filters);
    
    // Update selectedCategory to trigger server-side filtering
    if (filters.categories.length === 1) {
      setSelectedCategory(filters.categories[0]);
    } else if (filters.categories.length === 0) {
      setSelectedCategory("All");
    } else {
      // Multiple categories selected - use client-side filtering
      setSelectedCategory("All");
    }
  }, []);

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