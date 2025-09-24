/**
 * Search results display component
 * Handles result rendering and pagination
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { ArrowRight, Filter } from 'lucide-react';

interface SearchResultsProps {
  results: any[];
  query: string;
  onResultClick: (result: any) => void;
  onViewAllResults: () => void;
  maxDisplayed?: number;
  showViewAll?: boolean;
}

export function SearchResults({
  results,
  query,
  onResultClick,
  onViewAllResults,
  maxDisplayed = 3,
  showViewAll = true
}: SearchResultsProps) {
  if (results.length === 0) return null;

  const displayedResults = results.slice(0, maxDisplayed);
  const hasMore = results.length > maxDisplayed;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">
            Results for "{query}"
          </h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {results.length} found
        </Badge>
      </div>
      
      <div className="space-y-2">
        {displayedResults.map((result, index) => (
          <SearchResultItem
            key={`${result.type}-${result.id}-${index}`}
            result={result}
            searchQuery={query}
            variant="compact"
            onClick={() => onResultClick(result)}
          />
        ))}
      </div>

      {hasMore && showViewAll && (
        <Button
          variant="ghost"
          className="w-full mt-3 justify-center gap-2 text-primary hover:text-primary hover:bg-primary/10"
          onClick={onViewAllResults}
        >
          View all {results.length} results
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}