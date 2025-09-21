/**
 * Unified search result item component
 * Handles display of individual search results across different contexts
 */
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { HighlightedText } from './HighlightedText';
import { Heart, User, Building2 } from 'lucide-react';

interface SearchResultItemProps {
  result: {
    id: string;
    type: 'campaign' | 'user' | 'organization';
    title: string;
    subtitle?: string;
    image?: string;
    snippet?: string;
    link: string;
    relevanceScore?: number;
  };
  searchQuery: string;
  variant?: 'card' | 'list' | 'compact';
  className?: string;
  onClick?: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'campaign': return <Heart className="h-4 w-4" />;
    case 'user': return <User className="h-4 w-4" />;
    case 'organization': return <Building2 className="h-4 w-4" />;
    default: return <Heart className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'campaign': return 'bg-accent text-accent-foreground';
    case 'user': return 'bg-primary text-primary-foreground';
    case 'organization': return 'bg-secondary text-secondary-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const SearchResultItem = memo<SearchResultItemProps>(({
  result,
  searchQuery,
  variant = 'card',
  className,
  onClick
}) => {
  const handleClick = () => {
    onClick?.();
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${className || ''}`}
      >
        <div className="flex items-start gap-3">
          {result.image && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={result.image} alt={result.title} />
              <AvatarFallback className="text-xs">
                {getTypeIcon(result.type)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getTypeColor(result.type)} variant="secondary">
                {getTypeIcon(result.type)}
                <span className="ml-1 capitalize text-xs">{result.type}</span>
              </Badge>
            </div>
            
            <h4 className="font-medium text-sm mb-1 truncate">
              <HighlightedText
                text={result.title}
                searchQuery={searchQuery}
                className="font-medium text-sm"
              />
            </h4>
            
            {result.subtitle && (
              <HighlightedText
                text={result.subtitle}
                searchQuery={searchQuery}
                className="text-xs text-muted-foreground truncate"
                as="p"
              />
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className || ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {result.image && (
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={result.image} alt={result.title} />
              <AvatarFallback>
                {getTypeIcon(result.type)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getTypeColor(result.type)} variant="secondary">
                    {getTypeIcon(result.type)}
                    <span className="ml-1 capitalize">{result.type}</span>
                  </Badge>
                  {result.relevanceScore && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg mb-1">
                  <Link 
                    to={result.link} 
                    className="hover:text-primary transition-colors"
                    onClick={handleClick}
                  >
                    <HighlightedText
                      text={result.title}
                      searchQuery={searchQuery}
                      className="font-semibold text-lg"
                    />
                  </Link>
                </h3>
                
                {result.subtitle && (
                  <HighlightedText
                    text={result.subtitle}
                    searchQuery={searchQuery}
                    className="text-sm text-muted-foreground mb-2"
                    as="p"
                  />
                )}
                
                {result.snippet && (
                  <HighlightedText
                    text={result.snippet}
                    searchQuery={searchQuery}
                    className="text-sm text-foreground line-clamp-2"
                    as="p"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SearchResultItem.displayName = 'SearchResultItem';