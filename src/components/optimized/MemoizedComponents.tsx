/**
 * Memoized components for performance optimization
 */
import React from 'react';
import { UnifiedFundraiserCard } from '@/components/cards/UnifiedFundraiserCard';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { SearchSuggestionItem } from '@/components/search/SearchSuggestionItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Memoize heavy components to prevent unnecessary re-renders
export const MemoizedFundraiserCard = React.memo(UnifiedFundraiserCard, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.raisedAmount === nextProps.raisedAmount &&
    prevProps.goalAmount === nextProps.goalAmount &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.variant === nextProps.variant
  );
});

export const MemoizedSearchResultItem = React.memo(SearchResultItem, (prevProps, nextProps) => {
  return (
    prevProps.result.id === nextProps.result.id &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.variant === nextProps.variant
  );
});

export const MemoizedSearchSuggestionItem = React.memo(SearchSuggestionItem, (prevProps, nextProps) => {
  return (
    prevProps.suggestion.id === nextProps.suggestion.id &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.variant === nextProps.variant
  );
});

export const MemoizedLoadingSpinner = React.memo(LoadingSpinner);

// Custom hook for memoized callbacks
export const useMemoizedCallbacks = () => {
  const memoizedHandlers = React.useMemo(() => ({
    handleCardClick: React.useCallback((slug: string) => {
      // Navigation logic will be injected
    }, []),
    
    handleDonate: React.useCallback((id: string) => {
      // Donation logic will be injected
    }, []),
    
    handleSearch: React.useCallback((query: string) => {
      // Search logic will be injected
    }, [])
  }), []);

  return memoizedHandlers;
};