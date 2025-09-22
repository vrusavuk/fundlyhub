import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  SlidersHorizontal, 
  MapPin, 
  Clock,
  X,
  ChevronDown
} from 'lucide-react';
import type { Category } from '@/types/category';

interface FilterState {
  categories: string[];
  location: string;
  locationInput: string;
  timePeriod: string;
  nonprofitsOnly: boolean;
  closeToGoal: boolean;
}

interface CampaignFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount: number;
  initialCategory?: string;
  categories: Category[];
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
        {/* Compact Filter Bar - Mobile Optimized Single Row */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-hidden"  >
            
            {/* Advanced Filters Dialog - Icon Only */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex items-center gap-1 relative transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-0 ${
                    hasCustomFilters() 
                      ? "bg-accent text-accent-foreground border-accent-foreground/20" 
                      : ""
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 px-1 py-0 text-xs min-w-[1.2rem] h-5"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Filter Campaigns</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  
                {/* Categories Section */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={filters.categories.includes(category.name) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleCategoryToggle(category.name)}
                      >
                        <span className="mr-1">{category.emoji}</span>
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium mb-3 block flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  
                  {/* Location Dropdown */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Region</Label>
                    <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                      <SelectTrigger className="bg-background border border-border focus:outline-none focus-visible:ring-0">
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
                  
                  {/* Location Input */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">City or Zip Code</Label>
                    <Input
                      placeholder="Enter city name or zip code..."
                      value={filters.locationInput}
                      onChange={(e) => handleFilterChange('locationInput', e.target.value)}
                      className="bg-background border border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      e.g., "New York", "90210", "London"
                    </p>
                  </div>
                </div>

                  {/* Time Period */}
                  <div>
                    <Label className="text-base font-medium mb-3 block flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Period
                    </Label>
                    <Select value={filters.timePeriod} onValueChange={(value) => handleFilterChange('timePeriod', value)}>
                      <SelectTrigger className="bg-background border border-border focus:outline-none focus-visible:ring-0">
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

                  {/* Quick Filters */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Quick Filters</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dialog-nonprofits"
                          checked={filters.nonprofitsOnly}
                          onCheckedChange={(checked) => handleFilterChange('nonprofitsOnly', checked)}
                        />
                        <Label htmlFor="dialog-nonprofits" className="text-sm cursor-pointer">
                          Show only verified nonprofits
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dialog-closeToGoal"
                          checked={filters.closeToGoal}
                          onCheckedChange={(checked) => handleFilterChange('closeToGoal', checked)}
                        />
                        <Label htmlFor="dialog-closeToGoal" className="text-sm cursor-pointer">
                          Close to goal (80%+ funded)
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={clearAllFilters}
                      disabled={getActiveFiltersCount() === 0}
                    >
                      Clear All
                    </Button>
                    <Button onClick={() => setIsDialogOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Category Multi-Select Popover - Responsive Width */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-[90px] sm:w-[180px] justify-between transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-0 ${
                    hasCategoryFilters() 
                      ? "bg-accent text-accent-foreground border-accent-foreground/20" 
                      : "bg-background border border-border"
                  }`}
                >
                  <span className="truncate">
                    {filters.categories.length === 0 && <span className="hidden sm:inline">All Categories</span>}
                    {filters.categories.length === 0 && <span className="sm:hidden">All</span>}
                    {filters.categories.length === 1 && (
                      <span className="flex items-center gap-1">
                        <span>{categories.find(c => c.name === filters.categories[0])?.emoji}</span>
                        <span className="hidden sm:inline">{filters.categories[0]}</span>
                        <span className="sm:hidden">{filters.categories[0].slice(0, 4)}</span>
                      </span>
                    )}
                    {filters.categories.length > 1 && (
                      <span className="flex items-center gap-1">
                        <span className="hidden sm:inline">Multiple ({filters.categories.length})</span>
                        <span className="sm:hidden">{filters.categories.length}</span>
                      </span>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">Categories</Label>
                    {filters.categories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange('categories', [])}
                        className="h-auto p-1 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                        >
                          <span>{category.emoji}</span>
                          <span>{category.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Location Dropdown - Responsive Width */}
            <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
              <SelectTrigger 
                className={`w-[80px] sm:w-[160px] transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-0 ${
                  (filters.location !== 'All locations' || filters.locationInput.trim() !== '') 
                    ? "bg-accent text-accent-foreground border-accent-foreground/20" 
                    : "bg-background border border-border"
                }`}
              >
                <SelectValue>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{filters.location}</span>
                    <span className="sm:hidden text-xs">
                      {filters.location === 'All locations' ? 'All' : filters.location.slice(0, 3)}
                    </span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button - Compact */}
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

            {/* Active Filters Count - Mobile Friendly */}
            {getActiveFiltersCount() > 0 && (
              <div className="hidden md:flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">Active:</span>
                <div className="flex gap-1">
                  {filters.categories.slice(0, 1).map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs py-0 px-2 h-6">
                      {categories.find(c => c.name === category)?.emoji} {category}
                    </Badge>
                  ))}
                  {filters.categories.length > 1 && (
                    <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                      +{filters.categories.length - 1} more
                    </Badge>
                  )}
                  {filters.location !== 'All locations' && (
                    <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                      📍 {filters.location.slice(0, 8)}
                    </Badge>
                  )}
                  {(filters.nonprofitsOnly || filters.closeToGoal) && (
                    <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                      +filters
                    </Badge>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}