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
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Container */}
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-2xl 
                       w-full md:w-[600px] lg:w-[800px] xl:w-[900px] 
                       max-h-[80vh] md:max-h-[600px] 
                       overflow-hidden"
          >
            {/* Header with Search Info */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Search Results</h3>
                <Badge variant="outline" className="text-xs">
                  {results.length} total results
                </Badge>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                  className="h-8 text-sm"
                >
                  All ({results.length})
                </Button>
                <Button
                  variant={selectedType === 'campaign' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('campaign')}
                  className="h-8 text-sm"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Campaigns ({groupedResults.campaigns.length})
                </Button>
                <Button
                  variant={selectedType === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('user')}
                  className="h-8 text-sm"
                >
                  <User className="h-3 w-3 mr-1" />
                  Users ({groupedResults.users.length})
                </Button>
                <Button
                  variant={selectedType === 'organization' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('organization')}
                  className="h-8 text-sm"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Organizations ({groupedResults.organizations.length})
                </Button>
              </div>
            </div>

          {/* Results Content */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-red-500" />
                </div>
                <h4 className="font-medium text-lg mb-2">Search Error</h4>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : filteredResults.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-lg mb-2">No results found</h4>
                <p className="text-muted-foreground">
                  No {selectedType === 'all' ? 'results' : selectedType + 's'} found for "{query}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search terms or explore different categories
                </p>
              </div>
            ) : (
              <div className="grid gap-1 p-2">
                {filteredResults.map((result) => {
                  const Icon = getTypeIcon(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-4 hover:bg-muted/70 text-left transition-all duration-200 
                                 rounded-lg border border-transparent hover:border-border
                                 group focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <div className="flex items-start gap-4">
                        {/* Enhanced Icon/Image */}
                        <div className="flex-shrink-0">
                          {result.image ? (
                            <div className="relative">
                              <img
                                src={result.image}
                                alt={result.title}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover 
                                          ring-2 ring-border group-hover:ring-primary/30 transition-all"
                              />
                              <div className={cn(
                                "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs",
                                getTypeColor(result.type)
                              )}>
                                <Icon className="h-3 w-3" />
                              </div>
                            </div>
                          ) : (
                            <div className={cn(
                              "w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center transition-all",
                              getTypeColor(result.type)
                            )}>
                              <Icon className="h-8 w-8 md:h-10 md:w-10" />
                            </div>
                          )}
                        </div>

                        {/* Enhanced Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs font-medium", getTypeColor(result.type))}
                            >
                              {result.type}
                            </Badge>
                            {result.type === 'campaign' && (
                              <Badge variant="outline" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-base md:text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {result.title}
                          </h4>
                          
                          {result.subtitle && (
                            <p className="text-sm md:text-base text-muted-foreground line-clamp-2 mb-2">
                              {result.subtitle}
                            </p>
                          )}
                          
                          {result.location && (
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">
                                {result.location}
                              </span>
                            </div>
                          )}
                          
                          {/* Additional metadata for campaigns */}
                          {result.type === 'campaign' && (
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {Math.floor(Math.random() * 100) + 1} supporters
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Active campaign
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

          {/* Enhanced Footer */}
          {results.length > 0 && (
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredResults.length} of {results.length} results for "{query}"
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    navigate(`/campaigns?search=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                    setQuery('');
                    onResultClick?.();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Search className="h-4 w-4 mr-2" />
                  View all results
                </Button>
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}