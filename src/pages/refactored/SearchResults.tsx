/**
 * Refactored SearchResults page using new component architecture
 */
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchResultsContainer } from "@/components/search/SearchResultsContainer";
import { useEnhancedSearch } from "@/hooks/useEnhancedSearch";
import { useNavigate } from "react-router-dom";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const navigate = useNavigate();
  
  // Get query from URL params - this is the primary source
  const query = searchParams.get('q') || '';
  
  console.log('🔍 SearchResults page loaded with query:', query);
  
  const { results, loading, error, hasMore, loadMore, retry } = useEnhancedSearch({
    query,
    enabled: !!query
  });

  // Update search query in context when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    console.log('📍 URL query changed to:', urlQuery);
  }, [searchParams]);

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  const resultTypes = ['all', ...Array.from(new Set(results.map(r => r.type)))];

  const handleResultClick = (result: any) => {
    navigate(result.link);
  };

  if (!query) {
    return (
      <AppLayout>
        <PageContainer maxWidth="md">
          <div className="text-center">
            <PageHeader
              title="Search Results"
              description="No search query provided"
            />
            <Button asChild className="mt-4">
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
    <span className="text-sm text-muted-foreground">
      {filteredResults.length} results for "{query}"
    </span>
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