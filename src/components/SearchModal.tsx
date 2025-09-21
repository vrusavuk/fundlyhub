import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Building, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";
import { Badge } from "@/components/ui/badge";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'campaign' | 'user' | 'organization'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { results, loading, error } = useSearch(query);
  
  const filteredResults = results.filter(result => 
    selectedType === 'all' || result.type === selectedType
  );

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleResultClick = (result: any) => {
    if (result.type === 'campaign') {
      navigate(`/fundraiser/${result.id}`);
    } else if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'organization') {
      navigate(`/organization/${result.id}`);
    }
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return Heart;
      case 'user': return Users;
      case 'organization': return Building;
      default: return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-primary/10 text-primary border-primary/20';
      case 'user': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'organization': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-start justify-center pt-[10vh]">
        <div className="w-full max-w-2xl mx-4">
          {/* Search Header */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns, users, organizations..."
              className="w-full h-14 pl-12 pr-12 text-lg bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-2 flex items-center"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter Tabs */}
          {query.length >= 2 && (
            <div className="flex space-x-2 mb-6 justify-center">
              {[
                { key: 'all', label: 'All' },
                { key: 'campaign', label: 'Campaigns' },
                { key: 'user', label: 'Users' },
                { key: 'organization', label: 'Organizations' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedType === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(key as typeof selectedType)}
                  className="rounded-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          )}

          {/* Search Results */}
          <div className="bg-background border border-border rounded-xl shadow-xl max-h-[60vh] overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg">Start typing to search...</p>
                <p className="text-sm mt-2">Find campaigns, users, and organizations</p>
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">
                <p>Error searching. Please try again.</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg">No results found</p>
                <p className="text-sm mt-2">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="p-4">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 px-2">
                      {type}s ({typeResults.length})
                    </h3>
                    <div className="space-y-1">
                      {typeResults.slice(0, 5).map((result, index) => {
                        const IconComponent = getTypeIcon(result.type);
                        return (
                          <div
                            key={index}
                            onClick={() => handleResultClick(result)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                          >
                            <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {result.title}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {result.type}
                                </Badge>
                              </div>
                              {result.subtitle && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {result.subtitle}
                                </p>
                              )}
                              {result.location && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.location}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {filteredResults.length > 15 && (
                  <div className="pt-4 border-t border-border text-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(query)}&type=${selectedType}`);
                        onClose();
                      }}
                      className="w-full"
                    >
                      View all {filteredResults.length} results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Tips */}
          {query.length < 2 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd> to close
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}