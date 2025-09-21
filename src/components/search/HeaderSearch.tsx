import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useSearch } from "@/hooks/useSearch";
import { useGlobalSearch } from "@/contexts/SearchContext";
import { Search, X, ArrowRight, Heart, User, Building2 } from "lucide-react";

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'campaign': return <Heart className="h-3 w-3" />;
    case 'user': return <User className="h-3 w-3" />;
    case 'organization': return <Building2 className="h-3 w-3" />;
    default: return <Heart className="h-3 w-3" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'campaign': return 'bg-accent/10 text-accent';
    case 'user': return 'bg-primary/10 text-primary';
    case 'organization': return 'bg-secondary text-secondary-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface HeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeaderSearch({ isOpen, onClose }: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery, clearSearch, searchQuery: globalSearchQuery } = useGlobalSearch();

  const { results, loading } = useSearch({
    query,
    enabled: !!query && query.length >= 2
  });

  const isOnCampaignsPage = location.pathname === '/campaigns';
  const isOnSearchPage = location.pathname === '/search';
  const isOnIntegratedSearchPage = isOnCampaignsPage || isOnSearchPage;
  
  // On campaigns page, show summary notifications instead of individual results
  // On search page, don't show dropdown at all since results are on the page
  const shouldShowDropdown = !isOnSearchPage;
  
  // Get counts for different result types
  const campaignResults = results.filter(r => r.type === 'campaign');
  const userResults = results.filter(r => r.type === 'user');
  const organizationResults = results.filter(r => r.type === 'organization');
  
  const dropdownResults = isOnCampaignsPage 
    ? [] // Don't show individual results on campaigns page
    : results.slice(0, 5);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Sync with global search query when opening
      if (isOnIntegratedSearchPage && globalSearchQuery) {
        setQuery(globalSearchQuery);
      }
    }
  }, [isOpen, isOnIntegratedSearchPage, globalSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    // Update global search context for integrated search pages
    if (isOnIntegratedSearchPage) {
      setSearchQuery(value);
      
      // Update URL for search page
      if (isOnSearchPage && value.trim()) {
        const newUrl = `/search?q=${encodeURIComponent(value.trim())}`;
        if (window.location.pathname + window.location.search !== newUrl) {
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
    
    // On campaigns page, only show dropdown if there are user/org results
    // Use a timeout to ensure results are calculated first
    setTimeout(() => {
      const showDropdownCondition = isOnCampaignsPage 
        ? value.length >= 2 && shouldShowDropdown && (userResults.length > 0 || organizationResults.length > 0)
        : value.length >= 2 && shouldShowDropdown;
      
      setShowDropdown(showDropdownCondition);
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (isOnSearchPage) {
        // Already on search page, just update the query
        setSearchQuery(query);
        const newUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        // Navigate to search page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        handleClose();
      }
    }
  };

  const handleResultClick = (result: any) => {
    navigate(result.link);
    handleClose();
  };

  const handleViewAllResults = () => {
    if (query.trim()) {
      if (isOnSearchPage) {
        // Already on search page, just close the header search
        handleClose();
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    if (!isOnIntegratedSearchPage) {
      setQuery("");
    }
    setShowDropdown(false);
    if (!isOnIntegratedSearchPage) {
      setSearchQuery("");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-lg">
      <div className="container mx-auto px-4">
        <div className="relative" ref={dropdownRef}>
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="flex items-center h-16 gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  isOnCampaignsPage 
                    ? "Search campaigns..." 
                    : isOnSearchPage 
                      ? "Search campaigns, users, organizations..."
                      : "Search campaigns, users, organizations..."
                }
                className="pl-10 pr-12 h-10 border-0 bg-muted/50 focus:bg-background transition-colors"
              />
              {query && isOnIntegratedSearchPage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    clearSearch();
                    setShowDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </form>

          {/* Dropdown Results */}
          {showDropdown && (
            <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto shadow-xl border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {/* For campaigns page, show summary notifications */}
                    {isOnCampaignsPage ? (
                      <div className="p-4 space-y-3">
                        {(userResults.length > 0 || organizationResults.length > 0) ? (
                          <>
                            <div className="text-sm text-muted-foreground mb-3">
                              Additional results found:
                            </div>
                            
                            {userResults.length > 0 && (
                              <button
                                onClick={handleViewAllResults}
                                className="w-full text-left p-3 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md flex items-center gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <Badge className="bg-primary/10 text-primary" variant="secondary">
                                    User
                                  </Badge>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {userResults.length} user{userResults.length > 1 ? 's' : ''} found
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Click to view all search results
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                            
                            {organizationResults.length > 0 && (
                              <button
                                onClick={handleViewAllResults}
                                className="w-full text-left p-3 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md flex items-center gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-secondary-foreground" />
                                  <Badge className="bg-secondary text-secondary-foreground" variant="secondary">
                                    Organization
                                  </Badge>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {organizationResults.length} organization{organizationResults.length > 1 ? 's' : ''} found
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Click to view all search results
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            {query.length < 2 ? "Type at least 2 characters to search" : "No users or organizations found"}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular dropdown for other pages */
                      dropdownResults.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          {query.length < 2 ? "Type at least 2 characters to search" : "No results found"}
                        </div>
                      ) : (
                        <>
                          {dropdownResults.map((result, index) => (
                            <button
                              key={`${result.type}-${result.id}-${index}`}
                              onClick={() => handleResultClick(result)}
                              className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
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
                                    <span dangerouslySetInnerHTML={{ __html: result.highlightedTitle || result.title }} />
                                  </h4>
                                  
                                  {result.subtitle && (
                                    <p 
                                      className="text-xs text-muted-foreground truncate"
                                      dangerouslySetInnerHTML={{ __html: result.highlightedSubtitle || result.subtitle }}
                                    />
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                          
                          {/* View All Results */}
                          <button
                            onClick={handleViewAllResults}
                            className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-primary"
                          >
                            View all results for "{query}"
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}