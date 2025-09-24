/**
 * Individual search suggestion item component
 * Displays different types of search suggestions with appropriate styling
 */
import React from 'react';
import { SearchSuggestion } from '@/lib/services/searchSuggestions.service';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  TrendingUp, 
  Search, 
  Heart, 
  User, 
  Building2,
  Hash,
  ArrowUpRight
} from 'lucide-react';

interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion;
  searchQuery: string;
  onSelect: (suggestion: SearchSuggestion) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const getTypeIcon = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'recent':
      return <Clock className="h-4 w-4" />;
    case 'trending':
      return <TrendingUp className="h-4 w-4" />;
    case 'suggestion':
      return <Search className="h-4 w-4" />;
    default:
      return <Search className="h-4 w-4" />;
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'campaign':
      return <Heart className="h-3 w-3" />;
    case 'user':
      return <User className="h-3 w-3" />;
    case 'organization':
      return <Building2 className="h-3 w-3" />;
    default:
      return null;
  }
};

const getTypeColor = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'recent':
      return 'text-muted-foreground';
    case 'trending':
      return 'text-primary';
    case 'suggestion':
      return 'text-foreground';
    default:
      return 'text-foreground';
  }
};

const getTypeLabel = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'recent':
      return 'Recent';
    case 'trending':
      return 'Trending';
    case 'suggestion':
      return 'Suggested';
    default:
      return '';
  }
};

export function SearchSuggestionItem({
  suggestion,
  searchQuery,
  onSelect,
  className,
  variant = 'default'
}: SearchSuggestionItemProps) {
  console.log('🎪 SearchSuggestionItem render:', suggestion.text, 'variant:', variant);
  
  const handleClick = (e: React.MouseEvent) => {
    console.log('🖱️ SearchSuggestionItem clicked:', suggestion);
    console.log('🎯 Event details:', { target: e.currentTarget, type: e.type });
    console.log('🔗 About to call onSelect with:', suggestion.text);
    onSelect(suggestion);
    console.log('✅ onSelect called successfully');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(suggestion);
    }
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <mark key={index} className="bg-primary/20 text-primary font-medium">{part}</mark>;
      }
      return part;
    });
  };

  if (variant === 'compact') {
    console.log('🎯 Rendering compact SearchSuggestionItem for:', suggestion.text);
    return (
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 focus:bg-accent/50 focus:outline-none transition-all duration-200 rounded-md",
        "touch-manipulation min-h-[44px] sm:min-h-[36px] group",
        "hover:shadow-sm hover:border-primary/20 border border-transparent",
        "cursor-pointer", // Ensure cursor shows it's clickable
        className
      )}
        role="option"
        style={{ pointerEvents: 'auto' }} // Force pointer events
      >
        <div className={cn("flex-shrink-0", getTypeColor(suggestion.type))}>
          {getTypeIcon(suggestion.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {highlightText(suggestion.text, searchQuery)}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {suggestion.category && (
            <div className="text-muted-foreground">
              {getCategoryIcon(suggestion.category)}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Search</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full flex items-start gap-4 p-4 text-left hover:bg-accent/30 focus:bg-accent/50 focus:outline-none transition-all duration-200",
        "touch-manipulation min-h-[60px] group",
        "hover:shadow-sm hover:border-primary/20 border border-transparent rounded-lg",
        className
      )}
      role="option"
    >
      <div className={cn("flex-shrink-0 mt-1", getTypeColor(suggestion.type))}>
        {getTypeIcon(suggestion.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-medium">
            {highlightText(suggestion.text, searchQuery)}
          </span>
          {suggestion.category && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getCategoryIcon(suggestion.category)}
              <span className="capitalize">{suggestion.category}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{getTypeLabel(suggestion.type)}</span>
          {suggestion.count && suggestion.count > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {suggestion.count.toLocaleString()} searches
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground">
        <span className="text-xs font-medium">Search</span>
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </button>
  );
}