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

  // Get initial category from URL parameters  
  const initialCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
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
    limit: 24
  });

  // Enhanced filtering of fundraisers
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || 
        fundraiser.category === selectedCategory ||
        activeFilters.categories.length === 0 ||
        activeFilters.categories.includes(fundraiser.category || '');
      
      const matchesLocation = activeFilters.location === 'All locations' || 
        fundraiser.location?.toLowerCase().includes(activeFilters.location.toLowerCase());
      
      // Simple time period filtering (would need actual date logic in real implementation)
      const matchesTimePeriod = activeFilters.timePeriod === 'all';
      
      return matchesSearch && matchesCategory && matchesLocation && matchesTimePeriod;
    });
  }, [fundraisers, searchQuery, selectedCategory, activeFilters]);

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
            <>
              <span className="text-sm text-muted-foreground">
                {filteredFundraisers.length} campaigns found
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className="relative"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </>
          }
        />

        {/* Compact Filters Section */}
        <CampaignFilters
          onFiltersChange={handleFiltersChange}
          activeFiltersCount={getActiveFiltersCount()}
        />

        {/* Campaign Grid */}
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