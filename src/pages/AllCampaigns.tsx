import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { IntegratedCampaignSearch } from "@/components/search/IntegratedCampaignSearch";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useFundraisers } from "@/hooks/useFundraisers";
import { useGlobalSearch } from "@/contexts/SearchContext";

export default function AllCampaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openSearch } = useGlobalSearch();

  // Get initial search term from URL parameters  
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialSearch, initialCategory]);

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

  // Real-time filtering of fundraisers
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchTerm || 
        fundraiser.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || fundraiser.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [fundraisers, searchTerm, selectedCategory]);

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">All Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover and support amazing causes from around the world
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{filteredFundraisers.length} campaigns found</span>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Integrated Campaign Search */}
        <IntegratedCampaignSearch
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          selectedCategory={selectedCategory}
          resultCount={filteredFundraisers.length}
          totalCount={fundraisers.length}
          className="mb-6"
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
          emptyMessage={
            searchTerm || selectedCategory !== "All" 
              ? "Try adjusting your search or filters"
              : "No campaigns are currently available"
          }
        />
      </main>
    </div>
  );
}