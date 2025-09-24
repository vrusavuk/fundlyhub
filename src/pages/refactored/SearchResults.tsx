/**
 * Refactored SearchResults page using new component architecture with proper skeleton loading
 */
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchResultsContainer } from "@/components/search/SearchResultsContainer";
import { SearchPageSkeleton, Skeleton } from "@/components/skeletons";
import { LoadingState } from "@/components/common/LoadingState";
import { useEnhancedSearch } from "@/hooks/useEnhancedSearch";
import { useNavigate } from "react-router-dom";
import { useGlobalSearch } from "@/contexts/SearchContext";
import { ScreenReaderOnly } from "@/components/accessibility/ScreenReaderOnly";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  
  // Get query from URL params or global search context
  const urlQuery = searchParams.get('q') || '';
  const activeQuery = searchQuery || urlQuery;
  
  const { results, loading, error, hasMore, loadMore, retry } = useEnhancedSearch({
    query: activeQuery,
    enabled: !!activeQuery
  });

  // Sync global search context with URL on initial load only
  useEffect(() => {
    if (urlQuery && !searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, setSearchQuery]); // Only depend on urlQuery and setSearchQuery

  // Update URL when global search query changes (but not on every render)
  useEffect(() => {
    if (searchQuery && searchQuery !== urlQuery) {
      const timeoutId = setTimeout(() => {
        setSearchParams({ q: searchQuery }, { replace: true });
      }, 100); // Debounce to prevent rapid updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]); // Only depend on searchQuery

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  const resultTypes = ['all', ...Array.from(new Set(results.map(r => r.type)))];

  const handleResultClick = (result: any) => {
    navigate(result.link);
  };

  if (!activeQuery) {
    return (
      <AppLayout>
        <PageContainer maxWidth="md">
          <div className="text-center space-y-4">
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

  // Full page loading state for initial load
  if (loading && results.length === 0 && activeQuery) {
    return (
      <AppLayout>
        <PageContainer maxWidth="lg">
          <ScreenReaderOnly>
            <h1>Search Results - Loading</h1>
          </ScreenReaderOnly>
          <SearchPageSkeleton 
            showFilters={true}
            showStats={true}
            variant="card"
          />
        </PageContainer>
      </AppLayout>
    );
  }

  // Type filter buttons with loading states
  const typeFilters = (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {loading && results.length === 0 ? (
        // Filter loading skeleton
        <>
          <Skeleton className="h-9 w-16 rounded-md flex-shrink-0" />
          <Skeleton className="h-9 w-20 rounded-md flex-shrink-0" />
          <Skeleton className="h-9 w-16 rounded-md flex-shrink-0" />
          <Skeleton className="h-9 w-24 rounded-md flex-shrink-0" />
        </>
      ) : resultTypes.length > 1 ? (
        resultTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="capitalize flex-shrink-0"
          >
            {type === 'all' ? 'All' : `${type}s`}
            {type !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {results.filter(r => r.type === type).length}
              </Badge>
            )}
          </Button>
        ))
      ) : null}
    </div>
  );

  const headerActions = loading && results.length === 0 ? (
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-32" />
    </div>
  ) : (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground">
        {filteredResults.length} results for "{activeQuery}"
      </span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="font-medium text-primary">
            {results.length} Total
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <PageContainer maxWidth="lg">
        <ScreenReaderOnly>
          <h1>Search Results for "{activeQuery}"</h1>
        </ScreenReaderOnly>
        
        <PageHeader
          title="Search Results"
          actions={headerActions}
        />

        {typeFilters}

        <SearchResultsContainer
          results={filteredResults}
          searchQuery={activeQuery}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRetry={retry}
          onResultClick={handleResultClick}
          emptyMessage={`No results found for "${activeQuery}"`}
          variant="card"
        />
      </PageContainer>
    </AppLayout>
  );
}