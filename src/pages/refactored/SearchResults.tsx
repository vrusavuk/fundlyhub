/**
 * Refactored SearchResults page using new component architecture
 */
import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchResultsContainer } from "@/components/search/SearchResultsContainer";
import { useEnhancedSearch } from "@/hooks/useEnhancedSearch";
import { useGlobalSearch } from "@/contexts/SearchContext";
import { Search, X } from "lucide-react";

export default function SearchResults() {
  console.log('🚀 SearchResults component mounting...');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [inputQuery, setInputQuery] = useState('');
  const navigate = useNavigate();
  const { setSearchQuery } = useGlobalSearch();
  
  // Get query from URL params - this is the primary source
  const query = searchParams.get('q') || '';
  
  console.log('🔍 SearchResults page loaded with query:', query);
  console.log('🌐 Current URL:', window.location.href);
  console.log('📋 Search params:', Object.fromEntries(searchParams.entries()));
  console.log('🧭 Current route:', window.location.pathname);
  
  const { results, loading, error, hasMore, loadMore, retry } = useEnhancedSearch({
    query,
    enabled: !!query
  });

  // Sync input with URL query when component mounts or URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setInputQuery(urlQuery);
    setSearchQuery(urlQuery);
    console.log('📍 URL query changed to:', urlQuery);
  }, [searchParams, setSearchQuery]);

  // Update URL when user types in search input
  const handleSearchInputChange = (value: string) => {
    setInputQuery(value);
    
    // Update URL in real-time
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      setSearchParams({ q: inputQuery.trim() });
    }
  };

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  const resultTypes = ['all', ...Array.from(new Set(results.map(r => r.type)))];

  const handleResultClick = (result: any) => {
    navigate(result.link);
  };

  if (!query && !inputQuery) {
    return (
      <AppLayout>
        <PageContainer maxWidth="lg">
          <div className="text-center">
            <PageHeader
              title="Search"
              description="Search for campaigns, users, and organizations"
            />
            
            {/* Search Input */}
            <div className="max-w-md mx-auto mt-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={inputQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder="Search campaigns, users, organizations..."
                  className="pl-10 pr-10"
                  autoFocus
                />
                {inputQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearchInputChange('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>
            
            <Button asChild className="mt-6">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Type filter buttons
  const typeFilters = resultTypes.length > 1 && (
    <div className="flex gap-2 mb-6">
      {resultTypes.map((type) => (
        <Button
          key={type}
          variant={selectedType === type ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType(type)}
          className="capitalize"
        >
          {type === 'all' ? 'All' : `${type}s`}
          {type !== 'all' && (
            <Badge variant="secondary" className="ml-2">
              {results.filter(r => r.type === type).length}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-4">
      {/* Real-time search input */}
      <div className="relative w-80">
        <form onSubmit={handleSearchSubmit}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="Search campaigns, users, organizations..."
            className="pl-10 pr-10"
          />
          {inputQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSearchInputChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {filteredResults.length} results
      </span>
    </div>
  );

  return (
    <AppLayout>
      <PageContainer maxWidth="lg">
        <PageHeader
          title="Search Results"
          actions={headerActions}
        />

        {typeFilters}

        <SearchResultsContainer
          results={filteredResults}
          searchQuery={query}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRetry={retry}
          onResultClick={handleResultClick}
          emptyMessage={`No results found for "${query}"`}
        />
      </PageContainer>
    </AppLayout>
  );
}