import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, Building2, Heart, MapPin, Loader2 } from 'lucide-react';
import { useSearch, SearchResult } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

interface EnhancedSearchProps {
  className?: string;
  placeholder?: string;
  onResultClick?: () => void;
}

export function EnhancedSearch({ 
  className, 
  placeholder = "Search campaigns, users, organizations...",
  onResultClick 
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'campaign' | 'user' | 'organization'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { results, loading, error } = useSearch(query, isOpen);

  // Filter results by selected type
  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  // Group results by type for display
  const groupedResults = {
    campaigns: results.filter(r => r.type === 'campaign'),
    users: results.filter(r => r.type === 'user'),
    organizations: results.filter(r => r.type === 'organization')
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    onResultClick?.();

    switch (result.type) {
      case 'campaign':
        if (result.slug) {
          navigate(`/fundraiser/${result.slug}`);
        }
        break;
      case 'user':
        // Navigate to user profile when that page exists
        console.log('Navigate to user:', result.id);
        break;
      case 'organization':
        // Navigate to organization page when that exists
        console.log('Navigate to organization:', result.id);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return Heart;
      case 'user': return User;
      case 'organization': return Building2;
      default: return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-red-50 text-red-700 border-red-200';
      case 'user': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'organization': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden"
        >
          {/* Filter Tabs */}
          <div className="flex gap-1 p-3 border-b border-border">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className="h-7 text-xs"
            >
              All ({results.length})
            </Button>
            <Button
              variant={selectedType === 'campaign' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('campaign')}
              className="h-7 text-xs"
            >
              Campaigns ({groupedResults.campaigns.length})
            </Button>
            <Button
              variant={selectedType === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('user')}
              className="h-7 text-xs"
            >
              Users ({groupedResults.users.length})
            </Button>
            <Button
              variant={selectedType === 'organization' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('organization')}
              className="h-7 text-xs"
            >
              Orgs ({groupedResults.organizations.length})
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-muted-foreground">
                {error}
              </div>
            ) : filteredResults.length === 0 && !loading ? (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {filteredResults.map((result) => {
                  const Icon = getTypeIcon(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-muted/50 text-left transition-colors border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon/Image */}
                        <div className="flex-shrink-0">
                          {result.image ? (
                            <img
                              src={result.image}
                              alt={result.title}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getTypeColor(result.type))}
                            >
                              {result.type}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-1">
                            {result.title}
                          </h4>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {result.subtitle}
                            </p>
                          )}
                          {result.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {result.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View All Results Footer */}
          {results.length > 0 && (
            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate(`/campaigns?search=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                  setQuery('');
                  onResultClick?.();
                }}
                className="w-full text-sm"
              >
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}