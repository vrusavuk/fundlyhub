/**
 * Search suggestions display component
 * Handles recent searches, trending searches, and query-based suggestions
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchSuggestionItem } from '@/components/search/SearchSuggestionItem';
import { SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import { Clock, TrendingUp, Search, Sparkles } from 'lucide-react';

interface SearchSuggestionsProps {
  query: string;
  suggestions: SearchSuggestion[];
  recentSearches: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClearRecent: () => void;
  maxSuggestions?: number;
}

export function SearchSuggestions({
  query,
  suggestions,
  recentSearches,
  trendingSearches,
  onSuggestionSelect,
  onClearRecent,
  maxSuggestions = 6
}: SearchSuggestionsProps) {
  const hasQuery = query.trim().length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const hasTrendingSearches = trendingSearches.length > 0;

  return (
    <div className="space-y-4 p-2">
      {/* Query-based suggestions */}
      {hasQuery && hasSuggestions && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Search suggestions</h4>
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

      {/* Recent searches */}
      {!hasQuery && hasRecentSearches && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Recent searches</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecent}
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

      {/* Trending searches */}
      {!hasQuery && hasTrendingSearches && (
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
    </div>
  );
}