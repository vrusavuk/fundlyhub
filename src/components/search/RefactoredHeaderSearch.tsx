/**
 * Refactored HeaderSearch component using modular architecture
 * Clean, maintainable implementation following best practices
 */
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEnhancedSearch as useEnhancedSearchHook } from '@/hooks/useEnhancedSearch';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useSearchInput } from '@/hooks/useSearchInput';
import { useSearchNavigation } from '@/hooks/useSearchNavigation';
import { useEnhancedSearch } from '@/contexts/EnhancedSearchContext';

// Modular components
import { SearchModal } from './modular/SearchModal';
import { SearchInput } from './modular/SearchInput';
import { SearchDropdown } from './modular/SearchDropdown';
import { SearchLoadingState } from './modular/SearchLoadingState';
import { SearchEmptyState } from './modular/SearchEmptyState';
import { SearchResults } from './modular/SearchResults';
import { SearchSuggestions } from './modular/SearchSuggestions';

interface RefactoredHeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefactoredHeaderSearch({ isOpen, onClose }: RefactoredHeaderSearchProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { searchQuery: globalSearchQuery } = useEnhancedSearch();

  // Page detection
  const isOnCampaignsPage = location.pathname === '/campaigns';
  const isOnSearchPage = location.pathname === '/search';
  const isOnIntegratedSearchPage = isOnCampaignsPage || isOnSearchPage;
  
  // Show dropdown unless on search page where results are displayed inline
  const shouldShowDropdown = !isOnSearchPage;

  // Initialize hooks
  const {
    query,
    inputRef,
    handleInputChange,
    handleClear
  } = useSearchInput({
    initialQuery: isOnIntegratedSearchPage ? globalSearchQuery : '',
    autoFocus: isOpen
  });

  const { results, loading } = useEnhancedSearchHook({
    query,
    enabled: !!query && query.length >= 2
  });

  const {
    suggestions,
    recentSearches,
    trendingSearches,
    loading: suggestionsLoading,
    clearRecentSearches
  } = useSearchSuggestions({
    query,
    enabled: showDropdown
  });

  const {
    handleSubmit,
    handleSuggestionSelect,
    handleResultClick,
    handleViewAllResults
  } = useSearchNavigation({
    onNavigate: () => {
      handleClose();
    }
  });

  // Filter results for campaigns page
  const campaignResults = results.filter(r => r.type === 'campaign');
  const userResults = results.filter(r => r.type === 'user');
  const organizationResults = results.filter(r => r.type === 'organization');
  
  const filteredResults = isOnCampaignsPage 
    ? [...userResults, ...organizationResults] 
    : results;

  // Event handlers
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSubmit(query.trim(), results.length);
    }
  };

  const handleInputFocus = () => {
    if (shouldShowDropdown) {
      setShowDropdown(true);
    }
  };

  const handleClose = () => {
    if (!isOnIntegratedSearchPage) {
      handleClear();
    }
    setShowDropdown(false);
    onClose();
  };

  const handleDropdownClose = () => {
    setShowDropdown(false);
  };

  // Determine placeholder text
  const getPlaceholder = () => {
    if (isOnCampaignsPage) return "Search campaigns...";
    if (isOnSearchPage) return "Search campaigns, users, organizations...";
    return "Search campaigns, users, organizations...";
  };

  // Render states
  const renderDropdownContent = () => {
    const hasQuery = query.trim().length > 0;
    const isLoading = loading || suggestionsLoading;
    const hasResults = filteredResults.length > 0;
    const hasSuggestions = suggestions.length > 0;
    const hasRecentSearches = recentSearches.length > 0;
    const hasTrendingSearches = trendingSearches.length > 0;

    if (isLoading) {
      return <SearchLoadingState hasQuery={hasQuery} />;
    }

    if (!hasQuery) {
      if (!hasRecentSearches && !hasTrendingSearches) {
        return <SearchEmptyState type="no-query" />;
      }
      
      return (
        <SearchSuggestions
          query=""
          suggestions={[]}
          recentSearches={recentSearches}
          trendingSearches={trendingSearches}
          onSuggestionSelect={handleSuggestionSelect}
          onClearRecent={clearRecentSearches}
        />
      );
    }

    return (
      <div className="space-y-4 p-2">
        {/* Query-based suggestions */}
        {hasSuggestions && (
          <SearchSuggestions
            query={query}
            suggestions={suggestions}
            recentSearches={[]}
            trendingSearches={[]}
            onSuggestionSelect={handleSuggestionSelect}
            onClearRecent={() => {}}
          />
        )}

        {/* Results section */}
        {(!isOnCampaignsPage || (userResults.length > 0 || organizationResults.length > 0)) && (
          <>
            {hasSuggestions && hasResults && <div className="border-t border-border/20" />}
            {hasResults ? (
              <SearchResults
                results={filteredResults}
                query={query}
                onResultClick={(result) => handleResultClick(result, query, results.length)}
                onViewAllResults={() => handleViewAllResults(query, results.length)}
              />
            ) : query.length >= 2 ? (
              <SearchEmptyState 
                type="no-results" 
                query={query}
                suggestions={suggestions}
                onSuggestionSelect={handleSuggestionSelect}
              />
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <SearchModal isOpen={isOpen}>
      <SearchInput
        query={query}
        onChange={handleInputChange}
        onSubmit={handleFormSubmit}
        onClear={handleClear}
        onClose={handleClose}
        placeholder={getPlaceholder()}
        inputRef={inputRef}
        onFocus={handleInputFocus}
        autoFocus
      />
      
      <SearchDropdown
        isVisible={showDropdown}
        onClose={handleDropdownClose}
      >
        {renderDropdownContent()}
      </SearchDropdown>
    </SearchModal>
  );
}