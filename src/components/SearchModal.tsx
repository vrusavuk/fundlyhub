import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { results, loading, error } = useSearch(query);

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
        localStorage.removeItem('searchHistory');
      }
    }
  }, []);

  // Restore last search query when modal opens
  useEffect(() => {
    if (isOpen) {
      const lastQuery = localStorage.getItem('lastSearchQuery');
      if (lastQuery) {
        setQuery(lastQuery);
      }
      // Focus input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Save current query to localStorage whenever it changes (if it's a valid search)
  useEffect(() => {
    if (query.trim() && query.length >= 2) {
      localStorage.setItem('lastSearchQuery', query);
    }
  }, [query]);

  // Save search query to localStorage and history
  const saveSearchQuery = (searchQuery: string) => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      try {
        const savedHistory = localStorage.getItem('searchHistory');
        let history = savedHistory ? JSON.parse(savedHistory) : [];
        
        // Remove if already exists and add to beginning
        history = history.filter((item: string) => item !== searchQuery);
        history.unshift(searchQuery);
        
        // Keep only last 10 searches
        history = history.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
        setSearchHistory(history);
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }
  };
  
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleResultClick = (result: any) => {
    saveSearchQuery(query);
    if (result.type === 'campaign') {
      navigate(`/fundraiser/${result.id}`);
    } else if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'organization') {
      navigate(`/organization/${result.id}`);
    }
    onClose();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
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

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Full Screen Backdrop */}
      <div 
        className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Search Content */}
      <div 
        className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] pointer-events-none"
      >
        <div 
          className="w-full max-w-2xl mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  saveSearchQuery(query);
                }
              }}
              placeholder="Search campaigns, users, organizations..."
              className="w-full h-14 pl-12 pr-14 text-lg bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10"
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
            {query.length < 2 && searchHistory.length > 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Searches
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(historyQuery)}
                      className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors group flex items-center space-x-3"
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground group-hover:text-primary transition-colors">
                        {historyQuery}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : query.length < 2 ? (
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

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}