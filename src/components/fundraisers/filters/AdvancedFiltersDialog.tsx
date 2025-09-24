import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, MapPin, Clock } from 'lucide-react';
import type { Category } from '@/types/category';
import type { FilterState } from '@/types/filters';
import { LOCATIONS, TIME_PERIODS } from '@/types/filters';

interface AdvancedFiltersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  categories: Category[];
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onCategoryToggle: (categoryName: string) => void;
  onClearAll: () => void;
  getActiveFiltersCount: () => number;
  hasCustomFilters: () => boolean;
}

export function AdvancedFiltersDialog({
  isOpen,
  onOpenChange,
  filters,
  categories,
  onFilterChange,
  onCategoryToggle,
  onClearAll,
  getActiveFiltersCount,
  hasCustomFilters
}: AdvancedFiltersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`flex items-center gap-1 relative transition-all duration-200 flex-shrink-0 ${
            hasCustomFilters() 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent hover:text-accent-foreground"
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
                  onClick={() => onCategoryToggle(category.name)}
                >
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
              <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
                <SelectTrigger className="bg-background !border-0 focus:ring-0 focus:ring-offset-0">
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
                onChange={(e) => onFilterChange('locationInput', e.target.value)}
                className="bg-background !border-0 focus:ring-0 focus:ring-offset-0"
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
            <Select value={filters.timePeriod} onValueChange={(value) => onFilterChange('timePeriod', value)}>
              <SelectTrigger className="bg-background !border-0 focus:ring-0 focus:ring-offset-0">
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
                  onCheckedChange={(checked) => onFilterChange('nonprofitsOnly', checked)}
                />
                <Label htmlFor="dialog-nonprofits" className="text-sm cursor-pointer">
                  Show only verified nonprofits
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dialog-closeToGoal"
                  checked={filters.closeToGoal}
                  onCheckedChange={(checked) => onFilterChange('closeToGoal', checked)}
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
              onClick={onClearAll}
              disabled={getActiveFiltersCount() === 0}
            >
              Clear All
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}