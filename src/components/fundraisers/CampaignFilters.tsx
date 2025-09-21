import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  SlidersHorizontal, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Target, 
  Calendar,
  TrendingUp,
  X
} from 'lucide-react';
import { CATEGORIES } from '@/types/fundraiser';

interface FilterState {
  categories: string[];
  location: string;
  goalRange: [number, number];
  sortBy: string;
  timeframe: string;
  status: string[];
}

interface CampaignFiltersProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount: number;
}

const LOCATIONS = [
  'Worldwide',
  'United States',
  'Canada', 
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Near me'
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'funded', label: 'Most Funded' },
  { value: 'goal', label: 'Close to Goal' },
  { value: 'ending', label: 'Ending Soon' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' }
];

const TIMEFRAME_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Goal Reached' },
  { value: 'trending', label: 'Trending' },
  { value: 'verified', label: 'Verified' }
];

export function CampaignFilters({ 
  isExpanded, 
  onToggleExpanded, 
  onFiltersChange, 
  activeFiltersCount 
}: CampaignFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    location: 'Worldwide',
    goalRange: [0, 100000],
    sortBy: 'recent',
    timeframe: 'all',
    status: []
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

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange('status', newStatus);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterState = {
      categories: [],
      location: 'Worldwide',
      goalRange: [0, 100000],
      sortBy: 'recent',
      timeframe: 'all',
      status: []
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.location !== 'Worldwide') count++;
    if (filters.goalRange[0] > 0 || filters.goalRange[1] < 100000) count++;
    if (filters.sortBy !== 'recent') count++;
    if (filters.timeframe !== 'all') count++;
    if (filters.status.length > 0) count++;
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

        {/* Filter Content */}
        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
          <CollapsibleContent className="pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Categories Filter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
                </CardContent>
              </Card>

              {/* Location & Goal Amount */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location & Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Location</Label>
                    <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                      <SelectTrigger>
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

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Goal Amount: ${filters.goalRange[0].toLocaleString()} - ${filters.goalRange[1].toLocaleString()}
                    </Label>
                    <Slider
                      value={filters.goalRange}
                      onValueChange={(value) => handleFilterChange('goalRange', value as [number, number])}
                      max={100000}
                      min={0}
                      step={1000}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sorting & Timeframe */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sort & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Timeframe</Label>
                    <Select value={filters.timeframe} onValueChange={(value) => handleFilterChange('timeframe', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {TIMEFRAME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Status Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Badge className="h-4 w-4" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {STATUS_OPTIONS.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.value}
                        checked={filters.status.includes(status.value)}
                        onCheckedChange={() => handleStatusToggle(status.value)}
                      />
                      <Label htmlFor={status.value} className="text-sm cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
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
                  {filters.location !== 'Worldwide' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      📍 {filters.location}
                      <button
                        onClick={() => handleFilterChange('location', 'Worldwide')}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.status.map((status) => (
                    <Badge key={status} variant="secondary" className="flex items-center gap-1">
                      {STATUS_OPTIONS.find(s => s.value === status)?.label}
                      <button
                        onClick={() => handleStatusToggle(status)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}