/**
 * Enhanced search dropdown with better contrast, suggestions, and UX
 * Replaces the basic dropdown in HeaderSearch with improved functionality
 */
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchSuggestionItem } from './SearchSuggestionItem';
import { SearchResultItem } from './SearchResultItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  Search, 
  X,
  Sparkles,
  Filter
} from 'lucide-react';

interface EnhancedSearchDropdownProps {
  query: string;
  searchResults: any[];
  searchLoading: boolean;
  isVisible: boolean;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onResultClick: (result: any) => void;
  onViewAllResults: () => void;
  onClose: () => void;
  className?: string;
  showResultsSection?: boolean;
  maxHeight?: string;
}

export function EnhancedSearchDropdown({
  query,
  searchResults,
  searchLoading,
  isVisible,
  onSuggestionSelect,
  onResultClick,
  onViewAllResults,
  onClose,
  className,
  showResultsSection = true,
  maxHeight = 'max-h-[80vh]'
}: EnhancedSearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    suggestions,
    recentSearches,
    trendingSearches,
    loading: suggestionsLoading,
    clearRecentSearches
  } = useSearchSuggestions({
    query,
    enabled: isVisible,
    maxSuggestions: 6
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        onClose();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = searchResults.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const hasTrendingSearches = trendingSearches.length > 0;
  const isLoading = searchLoading || suggestionsLoading;

  return (
    <Card
      ref={dropdownRef}
      className={cn(
        "absolute top-full left-0 right-0 mt-2 shadow-2xl border-2 z-50",
        "bg-background/98 backdrop-blur-md",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200",
        maxHeight,
        className
      )}
    >
      <ScrollArea className="max-h-[70vh]">
        <div className="p-1">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-3 text-sm text-muted-foreground">
                {hasQuery ? 'Searching...' : 'Loading suggestions...'}
              </span>
            </div>
          )}

          {/* No Query State - Show Recent and Trending */}
          {!hasQuery && !isLoading && (
            <div className="space-y-4 p-2">
              {/* Recent Searches */}
              {hasRecentSearches && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium text-muted-foreground">Recent searches</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((suggestion) => (
                      <SearchSuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        searchQuery=""
                        onSelect={onSuggestionSelect}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              {hasTrendingSearches && (
                <div>
                  {hasRecentSearches && <Separator className="mb-4" />}
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-muted-foreground">Trending searches</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {trendingSearches.map((suggestion) => (
                      <SearchSuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        searchQuery=""
                        onSelect={onSuggestionSelect}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasRecentSearches && !hasTrendingSearches && (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search campaigns, users, and organizations
                  </p>
                </div>
              )}
            </div>
          )}

          {/* With Query State - Show Suggestions and Results */}
          {hasQuery && !isLoading && (
            <div className="space-y-4 p-2">
              {/* Search Suggestions */}
              {hasSuggestions && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-muted-foreground">Suggestions</h4>
                  </div>
                  <div className="space-y-1">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <SearchSuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        searchQuery={query}
                        onSelect={onSuggestionSelect}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {showResultsSection && (
                <>
                  {hasSuggestions && hasResults && <Separator />}
                  
                  {hasResults && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Results for "{query}"
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {searchResults.length} found
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {searchResults.slice(0, 3).map((result, index) => (
                          <SearchResultItem
                            key={`${result.type}-${result.id}-${index}`}
                            result={result}
                            searchQuery={query}
                            variant="compact"
                            onClick={() => onResultClick(result)}
                          />
                        ))}
                      </div>

                      {searchResults.length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full mt-3 justify-center gap-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={onViewAllResults}
                        >
                          View all {searchResults.length} results
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* No Results */}
                  {!hasResults && query.length >= 2 && (
                    <div className="text-center py-6">
                      <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium mb-1">No results found</p>
                      <p className="text-xs text-muted-foreground">
                        Try different keywords or check your spelling
                      </p>
                      
                      {hasSuggestions && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Try these suggestions:</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {suggestions.slice(0, 3).map((suggestion) => (
                              <Button
                                key={suggestion.id}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => onSuggestionSelect(suggestion)}
                              >
                                {suggestion.text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}