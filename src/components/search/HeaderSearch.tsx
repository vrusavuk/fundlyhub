import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EnhancedSearchDropdown } from "./EnhancedSearchDropdown";
import { SearchBackdrop } from "./SearchBackdrop";
import { useEnhancedSearch } from "@/hooks/useEnhancedSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useGlobalSearch } from "@/contexts/SearchContext";
import { SearchSuggestion } from "@/lib/services/searchSuggestions.service";
import { hapticFeedback } from "@/lib/utils/mobile";
import { Search, X } from "lucide-react";

interface HeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeaderSearch({ isOpen, onClose }: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchQuery, clearSearch, searchQuery: globalSearchQuery } = useGlobalSearch();

  const { results, loading } = useEnhancedSearch({
    query,
    enabled: !!query && query.length >= 2
  });

  const { addRecentSearch, trackSearch } = useSearchSuggestions({
    query,
    enabled: showDropdown
  });

  const isOnCampaignsPage = location.pathname === '/campaigns';
  const isOnSearchPage = location.pathname === '/search';
  const isOnIntegratedSearchPage = isOnCampaignsPage || isOnSearchPage;
  
  // Show dropdown unless on search page where results are displayed inline
  const shouldShowDropdown = !isOnSearchPage;
  
  // Get counts for different result types for campaigns page summary
  const campaignResults = results.filter(r => r.type === 'campaign');
  const userResults = results.filter(r => r.type === 'user');
  const organizationResults = results.filter(r => r.type === 'organization');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Sync with global search query when opening
      if (isOnIntegratedSearchPage && globalSearchQuery) {
        setQuery(globalSearchQuery);
      }
    }
  }, [isOpen, isOnIntegratedSearchPage, globalSearchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    
    // Show dropdown when user types
    setShowDropdown(shouldShowDropdown && value.length >= 0);
    
    // Haptic feedback for mobile
    if (value.length > 0) {
      hapticFeedback.light();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Add to recent searches and track
      addRecentSearch(query.trim());
      trackSearch(query.trim(), results.length);
      
      if (isOnSearchPage) {
        // Already on search page, just update the query
        setSearchQuery(query);
        const newUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        // Navigate to search page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      
      handleClose();
      hapticFeedback.medium();
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const selectedQuery = suggestion.text;
    setQuery(selectedQuery);
    
    // Add to recent searches and track
    addRecentSearch(selectedQuery, suggestion.category);
    trackSearch(selectedQuery, 0, suggestion.category);
    
    // Navigate to search or update current page
    if (isOnSearchPage) {
      setSearchQuery(selectedQuery);
      const newUrl = `/search?q=${encodeURIComponent(selectedQuery)}`;
      window.history.replaceState({}, '', newUrl);
    } else {
      navigate(`/search?q=${encodeURIComponent(selectedQuery)}`);
    }
    
    handleClose();
    hapticFeedback.light();
  };

  const handleResultClick = (result: any) => {
    // Track the click
    trackSearch(query, results.length, result.type);
    addRecentSearch(query, result.type);
    
    navigate(result.link);
    handleClose();
    hapticFeedback.light();
  };

  const handleViewAllResults = () => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      trackSearch(query.trim(), results.length);
      
      if (isOnSearchPage) {
        handleClose();
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        handleClose();
      }
      hapticFeedback.medium();
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
    <>
      {/* Search Backdrop */}
      <SearchBackdrop 
        show={showDropdown} 
        onClick={() => setShowDropdown(false)} 
      />
      
      {/* Search Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 border-b border-border/20 shadow-strong"
        style={{
          background: `
            linear-gradient(180deg, 
              hsl(var(--background) / 0.90) 0%, 
              hsl(var(--background) / 0.85) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(2.0) brightness(1.05)',
          WebkitBackdropFilter: 'blur(20px) saturate(2.0) brightness(1.05)',
          boxShadow: `
            0 6px 20px hsl(var(--foreground) / 0.12),
            inset 0 1px 0 hsl(var(--background) / 0.9),
            inset 0 -1px 0 hsl(var(--foreground) / 0.05)
          `
        }}
      >
      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="relative" ref={containerRef}>
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="flex items-center h-16 gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowDropdown(shouldShowDropdown)}
                placeholder={
                  isOnCampaignsPage 
                    ? "Search campaigns..." 
                    : isOnSearchPage 
                      ? "Search campaigns, users, organizations..."
                      : "Search campaigns, users, organizations..."
                }
                className={
                  "pl-10 pr-12 h-12 sm:h-10 border-2 bg-background focus:bg-background transition-all duration-200 " +
                  "focus:border-primary focus:shadow-lg focus:shadow-primary/20 animate-fade-in " +
                  "text-base sm:text-sm touch-manipulation"
                }
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    if (isOnIntegratedSearchPage) {
                      clearSearch();
                    }
                    setShowDropdown(false);
                    hapticFeedback.light();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="touch-target"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>

          {/* Enhanced Search Dropdown */}
          <EnhancedSearchDropdown
            query={query}
            searchResults={isOnCampaignsPage ? [...userResults, ...organizationResults] : results}
            searchLoading={loading}
            isVisible={showDropdown}
            onSuggestionSelect={handleSuggestionSelect}
            onResultClick={handleResultClick}
            onViewAllResults={handleViewAllResults}
            onClose={() => setShowDropdown(false)}
            showResultsSection={!isOnCampaignsPage || (userResults.length > 0 || organizationResults.length > 0)}
            maxHeight="max-h-[70vh]"
          />
        </div>
      </div>
      </div>
    </>
  );
}