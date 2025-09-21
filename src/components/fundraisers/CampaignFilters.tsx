import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  SlidersHorizontal, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Clock,
  X
} from 'lucide-react';
import { CATEGORIES } from '@/types/fundraiser';

interface FilterState {
  categories: string[];
  location: string;
  timePeriod: string;
  nonprofitsOnly: boolean;
  closeToGoal: boolean;
}

interface CampaignFiltersProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount: number;
}

const LOCATIONS = [
  'All locations',
  'United States',
  'Canada', 
  'United Kingdom',
  'Australia',
  'Near me'
];

const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
  { value: '12m', label: 'Past 12 months' }
];

export function CampaignFilters({ 
  isExpanded, 
  onToggleExpanded, 
  onFiltersChange, 
  activeFiltersCount 
}: CampaignFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    location: 'All locations',
    timePeriod: 'all',
    nonprofitsOnly: false,
    closeToGoal: false
  });

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
    if (filters.location !== 'All locations') count++;
    if (filters.timePeriod !== 'all') count++;
    if (filters.nonprofitsOnly) count++;
    if (filters.closeToGoal) count++;
    return count;
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter Toggle Header */}
        <div className="flex items-center justify-between py-4">
          <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all filters
              <X className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Filter Content - Simplified like GoFundMe */}
        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
          <CollapsibleContent className="pb-6">
            <div className="space-y-6">
              
              {/* Top row - Location and Quick filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Location Filter */}
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Period Filter */}
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time period
                  </Label>
                  <Select value={filters.timePeriod} onValueChange={(value) => handleFilterChange('timePeriod', value)}>
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {TIME_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Filter Toggles */}
                <div className="flex gap-4 items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nonprofits"
                      checked={filters.nonprofitsOnly}
                      onCheckedChange={(checked) => handleFilterChange('nonprofitsOnly', checked)}
                    />
                    <Label htmlFor="nonprofits" className="text-sm cursor-pointer">
                      Nonprofits
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="closeToGoal"
                      checked={filters.closeToGoal}
                      onCheckedChange={(checked) => handleFilterChange('closeToGoal', checked)}
                    />
                    <Label htmlFor="closeToGoal" className="text-sm cursor-pointer">
                      Close to goal
                    </Label>
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Category
                </Label>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground mb-2">Choose one or more</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CATEGORIES.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.name}
                          checked={filters.categories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label 
                          htmlFor={category.name} 
                          className="text-sm flex items-center gap-1 cursor-pointer"
                        >
                          <span>{category.emoji}</span>
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {filters.categories.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleFilterChange('categories', [])}
                      className="mt-2 text-xs"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              </div>

              {/* Reset Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="text-sm"
                  >
                    Reset filters
                  </Button>
                </div>
              )}

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {CATEGORIES.find(c => c.name === category)?.emoji}
                      {category}
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.location !== 'All locations' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      📍 {filters.location}
                      <button
                        onClick={() => handleFilterChange('location', 'All locations')}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.timePeriod !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {TIME_PERIODS.find(t => t.value === filters.timePeriod)?.label}
                      <button
                        onClick={() => handleFilterChange('timePeriod', 'all')}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.nonprofitsOnly && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Nonprofits
                      <button
                        onClick={() => handleFilterChange('nonprofitsOnly', false)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.closeToGoal && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Close to goal
                      <button
                        onClick={() => handleFilterChange('closeToGoal', false)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}