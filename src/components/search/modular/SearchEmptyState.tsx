/**
 * Search empty state component
 * Displays helpful messages when no results or suggestions are available
 */
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchSuggestion } from '@/lib/services/searchSuggestions.service';

interface SearchEmptyStateProps {
  type: 'no-query' | 'no-results' | 'no-suggestions';
  query?: string;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

export function SearchEmptyState({ 
  type, 
  query,
  suggestions = [],
  onSuggestionSelect
}: SearchEmptyStateProps) {
  if (type === 'no-query') {
    return (
      <div className="text-center py-8">
        <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Start typing to search campaigns, users, and organizations
        </p>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="text-center py-6">
        <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium mb-1">No results found</p>
        <p className="text-xs text-muted-foreground">
          Try different keywords or check your spelling
        </p>
        
        {suggestions.length > 0 && onSuggestionSelect && (
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
    );
  }

  return null;
}