import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useFundraisers } from "@/hooks/useFundraisers";
import { useGlobalSearch } from "@/contexts/SearchContext";

export default function AllCampaigns() {
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  // Real-time filtering of fundraisers
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || fundraiser.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [fundraisers, searchQuery, selectedCategory]);

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
      </main>
    </div>
  );
}