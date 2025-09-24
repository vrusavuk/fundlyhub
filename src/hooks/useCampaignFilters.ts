/**
 * Campaign Filters Hook - Clean filtering logic
 * Provides efficient client-side and server-side filtering capabilities
 */
import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface FilterState {
  categories: string[];
  location: string;
  timePeriod: string;
  nonprofitsOnly: boolean;
  closeToGoal: boolean;
}

interface UseCampaignFiltersProps {
  fundraisers: any[];
  searchQuery?: string;
}

export function useCampaignFilters({ fundraisers, searchQuery }: UseCampaignFiltersProps) {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    categories: initialCategory !== 'All' ? [initialCategory] : [],
    location: 'All locations',
    timePeriod: 'all',
    nonprofitsOnly: false,
    closeToGoal: false
  });

  // Enhanced filtering for both server-side and client-side
  const filteredFundraisers = useMemo(() => {
    return fundraisers.filter((fundraiser) => {
      const matchesSearch = !searchQuery || 
        fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fundraiser.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filtering for multiple categories (client-side)
      const matchesMultipleCategories = activeFilters.categories.length <= 1 || 
        activeFilters.categories.includes(fundraiser.category || '');
      
      const matchesLocation = activeFilters.location === 'All locations' || 
        fundraiser.location?.toLowerCase().includes(activeFilters.location.toLowerCase());
      
      // Time period filtering based on created_at
      const matchesTimePeriod = () => {
        if (activeFilters.timePeriod === 'all') return true;
        
        const createdAt = new Date(fundraiser.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        
        switch (activeFilters.timePeriod) {
          case '24h':
            return diffMs <= 24 * 60 * 60 * 1000;
          case '7d':
            return diffMs <= 7 * 24 * 60 * 60 * 1000;
          case '30d':
            return diffMs <= 30 * 24 * 60 * 60 * 1000;
          case '12m':
            return diffMs <= 365 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      };
      
      return matchesSearch && matchesMultipleCategories && matchesLocation && matchesTimePeriod();
    });
  }, [fundraisers, searchQuery, activeFilters]);

  const handleFiltersChange = useCallback((filters: FilterState) => {
    setActiveFilters(filters);
    
    // Update selectedCategory to trigger server-side filtering
    if (filters.categories.length === 1) {
      setSelectedCategory(filters.categories[0]);
    } else if (filters.categories.length === 0) {
      setSelectedCategory("All");
    } else {
      // Multiple categories selected - use client-side filtering
      setSelectedCategory("All");
    }
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (activeFilters.categories.length > 0) count++;
    if (activeFilters.location !== 'All locations') count++;
    if (activeFilters.timePeriod !== 'all') count++;
    if (activeFilters.nonprofitsOnly) count++;
    if (activeFilters.closeToGoal) count++;
    return count;
  }, [activeFilters]);

  return {
    selectedCategory,
    setSelectedCategory,
    activeFilters,
    filteredFundraisers,
    handleFiltersChange,
    getActiveFiltersCount,
    initialCategory
  };
}