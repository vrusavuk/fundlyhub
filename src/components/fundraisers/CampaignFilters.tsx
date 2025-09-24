import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AdvancedFiltersDialog } from './filters/AdvancedFiltersDialog';
import { CategoryPopover } from './filters/CategoryPopover';
import { LocationSelect } from './filters/LocationSelect';
import { ActiveFiltersBadges } from './filters/ActiveFiltersBadges';
import type { FilterState, CampaignFiltersProps } from '@/types/filters';

export function CampaignFilters({ 
  onFiltersChange, 
  activeFiltersCount,
  initialCategory,
  categories
}: CampaignFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: initialCategory && initialCategory !== 'All' ? [initialCategory] : [],
    location: 'All locations',
    locationInput: '',
    timePeriod: 'all',
    nonprofitsOnly: false,
    closeToGoal: false
  });

  // Update filters when initialCategory changes and sync with selectedCategory
  useEffect(() => {
    if (initialCategory && initialCategory !== 'All') {
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters, categories: [initialCategory] };
        onFiltersChange(newFilters);
        return newFilters;
      });
    }
  }, [initialCategory, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoryToggle = (categoryName: string) => {
    const newCategories = filters.categories.includes(categoryName)
      ? filters.categories.filter(c => c !== categoryName)
      : [...filters.categories, categoryName];
    handleFilterChange('categories', newCategories);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      categories: [],
      location: 'All locations',
      locationInput: '',
      timePeriod: 'all',
      nonprofitsOnly: false,
      closeToGoal: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.location !== 'All locations' || filters.locationInput.trim() !== '') count++;
    if (filters.timePeriod !== 'all') count++;
    if (filters.nonprofitsOnly) count++;
    if (filters.closeToGoal) count++;
    return count;
  };

  // Check if custom filters (non-category) are active
  const hasCustomFilters = () => {
    return filters.location !== 'All locations' || 
           filters.locationInput.trim() !== '' ||
           filters.timePeriod !== 'all' ||
           filters.nonprofitsOnly ||
           filters.closeToGoal;
  };

  // Check if categories are selected
  const hasCategoryFilters = () => {
    return filters.categories.length > 0;
  };

  return (
    <div className="border-b border-border bg-background -mx-4 mb-6">
      <div className="px-4 py-4">
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <AdvancedFiltersDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onCategoryToggle={handleCategoryToggle}
            onClearAll={clearAllFilters}
            getActiveFiltersCount={getActiveFiltersCount}
            hasCustomFilters={hasCustomFilters}
          />

          <CategoryPopover
            filters={filters}
            categories={categories}
            onCategoryToggle={handleCategoryToggle}
            onFilterChange={handleFilterChange}
            hasCategoryFilters={hasCategoryFilters}
          />

          <LocationSelect
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground flex-shrink-0 focus:outline-none focus-visible:ring-0"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          <ActiveFiltersBadges
            filters={filters}
            getActiveFiltersCount={getActiveFiltersCount}
          />
        </div>
      </div>
    </div>
  );
}