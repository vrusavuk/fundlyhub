/**
 * Enhanced Global Search Modal with unified experience
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Users, Building, Heart, ArrowRight, Clock, Command } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/useSearch";
import { useGlobalSearch } from "@/contexts/SearchContext";

export function GlobalSearchModal() {
  const { isSearchOpen, closeSearch } = useGlobalSearch();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'campaign' | 'user' | 'organization'>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { results, loading, error, hasMore, loadMore } = useSearch(query, isSearchOpen);

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        localStorage.removeItem('searchHistory');
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen]);

  const saveSearchQuery = (searchQuery: string) => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      try {
        const savedHistory = localStorage.getItem('searchHistory');
        let history = savedHistory ? JSON.parse(savedHistory) : [];
        
        history = history.filter((item: string) => item !== searchQuery);
        history.unshift(searchQuery);
        history = history.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
        setSearchHistory(history);
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }
  };

  const handleResultClick = (result: any) => {
    saveSearchQuery(query);
    closeSearch();
    
    if (result.type === 'campaign') {
      navigate(`/fundraiser/${result.slug || result.id}`);
    } else if (result.type === 'user') {
      // TODO: Navigate to user profile
      console.log('User profile navigation not implemented yet');
    } else if (result.type === 'organization') {
      // TODO: Navigate to organization page
      console.log('Organization page navigation not implemented yet');
    }
  };

  const handleViewAllResults = () => {
    if (query.trim()) {
      saveSearchQuery(query);
      navigate(`/campaigns?search=${encodeURIComponent(query)}`);
      closeSearch();
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

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

  const getContextualMessage = () => {
    const path = location.pathname;
    if (path === '/campaigns') {
      return "Search through all campaigns and discover new causes";
    }
    if (path.startsWith('/fundraiser/')) {
      return "Find other campaigns or explore new causes";
    }
    if (path === '/') {
      return "Discover campaigns, connect with causes, find organizations";
    }
    return "Search across campaigns, users, and organizations";
  };

  if (!isSearchOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
        onClick={closeSearch}
      />
      
      {/* Search Modal */}
      <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[8vh] pointer-events-none">
        <div 
          className="w-full max-w-3xl mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="bg-background border border-border rounded-t-xl shadow-xl">
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleViewAllResults();
                    }
                  }}
                  placeholder="Search campaigns, users, organizations..."
                  className="w-full h-14 pl-12 pr-16 text-lg bg-background border-0 focus:outline-none placeholder:text-muted-foreground"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs hidden md:flex items-center gap-1">
                    <Command className="h-3 w-3" />
                    K
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeSearch}
                    className="h-10 w-10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {getContextualMessage()}
              </p>
            </div>

            {/* Type Filters */}
            {query.length >= 2 && results.length > 0 && (
              <div className="px-6 py-4 border-b border-border">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('all')}
                    className="h-8"
                  >
                    All ({results.length})
                  </Button>
                  {Object.entries(groupedResults).map(([type, typeResults]) => {
                    const Icon = getTypeIcon(type);
                    return (
                      <Button
                        key={type}
                        variant={selectedType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType(type as typeof selectedType)}
                        className="h-8"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {type}s ({typeResults.length})
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="bg-background border-x border-border max-h-[60vh] overflow-y-auto">
            {query.length < 2 && searchHistory.length > 0 ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchHistory}
                    className="text-xs text-muted-foreground hover:text-foreground h-6"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(historyQuery)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{historyQuery}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : query.length < 2 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl mb-2">Start typing to search</p>
                <p className="text-sm">Find campaigns, users, and organizations</p>
              </div>
            ) : loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-destructive">
                <p>Search error. Please try again.</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl mb-2">No results found</p>
                <p className="text-sm">Try different keywords or browse all campaigns</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    navigate('/campaigns');
                    closeSearch();
                  }}
                >
                  Browse All Campaigns
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-1">
                  {filteredResults.slice(0, 8).map((result, index) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <div
                        key={`${result.type}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 
                              className="font-medium text-foreground group-hover:text-primary transition-colors truncate"
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlightedTitle || result.title 
                              }}
                            />
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          {result.subtitle && (
                            <p 
                              className="text-sm text-muted-foreground truncate"
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlightedSubtitle || result.subtitle 
                              }}
                            />
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
                
                {results.length > 8 && (
                  <div className="border-t border-border mt-4 pt-4">
                    <Button 
                      onClick={handleViewAllResults}
                      className="w-full"
                      variant="outline"
                    >
                      View All {results.length} Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="bg-background border border-t-0 border-border rounded-b-xl p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                  <span>to view all</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
              {query.length >= 2 && (
                <span>{filteredResults.length} of {results.length} results</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}