import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { CategorySelector } from "@/components/fundraisers/CategorySelector";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Search } from "lucide-react";
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

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

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
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    searchTerm: searchTerm || undefined
  });

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  const filteredFundraisers = fundraisers.filter((fundraiser) => {
    const matchesSearch = !searchTerm || 
      fundraiser.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fundraiser.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fundraiser.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || fundraiser.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Global Search Button */}
          <div className="max-w-2xl">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground h-12"
              onClick={() => openSearch(searchTerm)}
            >
              <Search className="h-4 w-4 mr-3" />
              {initialSearch ? `Searching for: "${initialSearch}"` : "Search campaigns, users, organizations..."}
            </Button>
          </div>
          
          {/* Category Filter */}
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
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