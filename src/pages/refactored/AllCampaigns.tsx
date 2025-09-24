/**
 * Refactored AllCampaigns page using new component architecture
 * Demonstrates best practices with composition pattern
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { useFundraisers } from "@/hooks/useFundraisers";
import { useGlobalSearch } from "@/contexts/UnifiedSearchContext";

export default function AllCampaigns() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchQuery } = useGlobalSearch();

  // Get initial category from URL parameters (decode URI component and capitalize properly)
  const urlCategory = searchParams.get('category');
  const initialCategory = urlCategory ? decodeURIComponent(urlCategory) : 'All';

  useEffect(() => {
    if (initialCategory && initialCategory !== 'All') {
      setSelectedCategory(initialCategory);
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
    limit: 24
  });

  // Real-time filtering of fundraisers
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Match by category name (fundraiser.category is the text name, not ID)
      const matchesCategory = selectedCategory === "All" || fundraiser.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [fundraisers, searchQuery, selectedCategory]);

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  // Page header actions
  const headerActions = (
    <>
      <span className="text-sm text-muted-foreground">
        {filteredFundraisers.length} campaigns found
      </span>
      <Button variant="outline" size="sm">
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filters
      </Button>
    </>
  );

  const emptyMessage = searchQuery || selectedCategory !== "All" 
    ? "Try adjusting your search or filters"
    : "No campaigns are currently available";

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title="All Campaigns"
          description="Discover and support amazing causes from around the world"
          actions={headerActions}
        />

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
          emptyMessage={emptyMessage}
        />
      </PageContainer>
    </AppLayout>
  );
}