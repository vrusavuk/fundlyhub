/**
 * Smart search suggestions with AI-powered recommendations
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/animations/AnimatedCard';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Users, 
  Heart,
  MapPin,
  Calendar,
  Tag,
  Sparkles
} from 'lucide-react';

interface SmartSearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  className?: string;
}

// Predefined smart suggestions based on common patterns
const TRENDING_SEARCHES = [
  'Medical emergencies',
  'Education scholarships',
  'Disaster relief',
  'Animal rescue',
  'Community projects'
];

const CATEGORY_SUGGESTIONS = [
  { icon: Heart, label: 'Medical', query: 'medical help' },
  { icon: Users, label: 'Education', query: 'education support' },
  { icon: MapPin, label: 'Emergency', query: 'emergency relief' },
  { icon: Calendar, label: 'Events', query: 'community events' },
  { icon: Tag, label: 'Animals', query: 'animal rescue' }
];

const QUICK_FILTERS = [
  'Near me',
  'Ending soon',
  'Fully funded',
  'New campaigns',
  'Verified only'
];

export function SmartSearchSuggestions({
  query,
  onSuggestionClick,
  onClose,
  className
}: SmartSearchSuggestionsProps) {
  const { preferences } = useUserPreferences();
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  // Generate smart suggestions based on query
  const generateSmartSuggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Auto-complete suggestions
    const autoCompletes = [
      `${query} near me`,
      `${query} fundraiser`,
      `${query} campaign`,
      `${query} emergency`,
      `${query} help`
    ];

    // Add relevant auto-completes
    autoCompletes.forEach(suggestion => {
      if (suggestion.toLowerCase() !== queryLower) {
        suggestions.push(suggestion);
      }
    });

    // Add category-based suggestions
    CATEGORY_SUGGESTIONS.forEach(category => {
      if (category.label.toLowerCase().includes(queryLower) || 
          queryLower.includes(category.label.toLowerCase())) {
        suggestions.push(category.query);
      }
    });

    return suggestions.slice(0, 5);
  }, [query]);

  useEffect(() => {
    setSmartSuggestions(generateSmartSuggestions);
  }, [generateSmartSuggestions]);

  if (!preferences.searchSuggestions) {
    return null;
  }

  const hasQuery = query && query.length > 0;
  const hasRecentSearches = preferences.recentSearches.length > 0;

  return (
    <Card className={cn('absolute top-full left-0 right-0 z-50 mt-2', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Smart AI Suggestions */}
        {hasQuery && smartSuggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Smart Suggestions
            </div>
            <div className="space-y-1">
              {smartSuggestions.map((suggestion, index) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2 text-left hover:bg-accent/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate">
                    <span className="font-medium">{query}</span>
                    <span className="text-muted-foreground">
                      {suggestion.substring(query.length)}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!hasQuery && hasRecentSearches && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Recent Searches
            </div>
            <div className="space-y-1">
              {preferences.recentSearches.slice(0, 5).map((search, index) => (
                <Button
                  key={search}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2 text-left hover:bg-accent/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => onSuggestionClick(search)}
                >
                  <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate">{search}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        {!hasQuery && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Trending
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((trend, index) => (
                <Badge
                  key={trend}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onSuggestionClick(trend)}
                >
                  {trend}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Category Quick Access */}
        {!hasQuery && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              Browse Categories
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_SUGGESTIONS.map((category, index) => (
                <Button
                  key={category.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 animate-fade-in hover:border-primary"
                  style={{ animationDelay: `${index * 75}ms` }}
                  onClick={() => onSuggestionClick(category.query)}
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        {!hasQuery && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Quick Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter, index) => (
                <Badge
                  key={filter}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:border-accent-foreground transition-colors animate-scale-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                  onClick={() => onSuggestionClick(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        )}
        </CardContent>
    </Card>
  );
}