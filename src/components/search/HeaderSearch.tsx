/**
 * Main header search component with integrated functionality
 * Provides comprehensive search with suggestions and results
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EnhancedSearchDropdown } from "./EnhancedSearchDropdown";
import { useEnhancedSearch } from "@/hooks/useEnhancedSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useGlobalSearch } from "@/contexts/UnifiedSearchContext";
import { SearchSuggestion } from "@/lib/services/searchSuggestions.service";
import { hapticFeedback } from "@/lib/utils/mobile";
import { Search, X, Delete } from "lucide-react";

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
      
      // Close the header search immediately
      handleClose();
      
      // Navigate directly to search results page
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      hapticFeedback.medium();
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const selectedQuery = suggestion.text;
    
    // Add to recent searches and track
    try {
      addRecentSearch(selectedQuery, suggestion.category);
      trackSearch(selectedQuery, 0, suggestion.category);
    } catch (error) {
      console.error('Error in search tracking:', error);
    }
    
    // ALWAYS navigate to search page for suggestions, regardless of current page
    try {
      // Close the modal first to avoid any interference
      onClose();
      
      // Force navigation to search page
      navigate(`/search?q=${encodeURIComponent(selectedQuery)}`, { replace: false });
    } catch (error) {
      console.error('Navigation failed:', error);
    }
    
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
      try {
        addRecentSearch(query.trim());
        trackSearch(query.trim(), results.length);
        
        const targetUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        
        // Close modal first to avoid interference
        onClose();
        
        // Force navigation to search results page
        navigate(targetUrl, { replace: false });
        
        hapticFeedback.medium();
      } catch (error) {
        console.error('Error in handleViewAllResults:', error);
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
    <>      
      {/* Search Header - FIXED positioning for scroll persistence */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 shadow-strong"
        style={{
          background: `hsla(var(--background), 0.9)`,
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          borderRadius: 'var(--radius)',
          boxShadow: `
            0 8px 32px -8px hsla(var(--foreground), 0.15),
            0 4px 16px -4px hsla(var(--foreground), 0.1),
            inset 0 1px 0 hsla(var(--background), 0.5),
            inset 0 -1px 0 hsla(var(--border), 0.1)
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-full transition-colors duration-200"
                  title="Clear search"
                >
                  <Delete className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
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
        </div>
      </div>
      </div>

      {/* Enhanced Search Dropdown */}
      {showDropdown && (
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
      )}
    </>
  );
}