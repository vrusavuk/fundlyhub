import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  SlidersHorizontal, 
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
  onFiltersChange, 
  activeFiltersCount 
}: CampaignFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Compact Filter Bar - Reordered: Filters, Categories, Location, Reset */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Advanced Filters Dialog - FIRST */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 relative">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs min-w-[1.2rem] h-5">
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
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dialog-${category.name}`}
                          checked={filters.categories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label 
                          htmlFor={`dialog-${category.name}`} 
                          className="text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <span>{category.emoji}</span>
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <Label className="text-base font-medium mb-3 block flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Period
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

          {/* Category Dropdown - SECOND */}
          <Select 
            value={filters.categories.length === 1 ? filters.categories[0] : filters.categories.length > 1 ? 'multiple' : 'all'} 
            onValueChange={(value) => {
              if (value === 'all') {
                handleFilterChange('categories', []);
              } else if (value !== 'multiple') {
                handleFilterChange('categories', [value]);
              }
            }}
          >
            <SelectTrigger className="w-[180px] bg-background border border-border">
              <SelectValue placeholder="Category">
                {filters.categories.length === 0 && "All Categories"}
                {filters.categories.length === 1 && (
                  <span className="flex items-center gap-1">
                    {CATEGORIES.find(c => c.name === filters.categories[0])?.emoji}
                    {filters.categories[0]}
                  </span>
                )}
                {filters.categories.length > 1 && (
                  <span className="flex items-center gap-1">
                    Multiple ({filters.categories.length})
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  <span className="flex items-center gap-2">
                    {category.emoji} {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location Dropdown - THIRD */}
          <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
            <SelectTrigger className="w-[160px] bg-background border border-border">
              <SelectValue>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {filters.location}
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

          {/* Reset Button - FOURTH */}
          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Reset filters
            </Button>
          )}

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Active:</span>
              <div className="flex gap-1 flex-wrap">
                {filters.categories.slice(0, 2).map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs py-0 px-2 h-6">
                    {CATEGORIES.find(c => c.name === category)?.emoji} {category}
                  </Badge>
                ))}
                {filters.categories.length > 2 && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                    +{filters.categories.length - 2} more
                  </Badge>
                )}
                {filters.location !== 'All locations' && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                    📍 {filters.location}
                  </Badge>
                )}
                {filters.nonprofitsOnly && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                    Nonprofits
                  </Badge>
                )}
                {filters.closeToGoal && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
                    Close to goal
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