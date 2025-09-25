import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export interface SearchFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: any;
  displayValue: string;
}

interface AdvancedSearchProps {
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  searchPlaceholder?: string;
  availableFilters?: SearchFilter[];
  className?: string;
}

export function AdvancedSearch({
  onSearchChange,
  onFiltersChange,
  searchPlaceholder = "Search...",
  availableFilters = [],
  className,
}: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  // Handle filter changes
  useEffect(() => {
    onFiltersChange(activeFilters);
  }, [activeFilters, onFiltersChange]);

  const addFilter = useCallback((filter: SearchFilter, value: any, displayValue?: string) => {
    const newFilter: ActiveFilter = {
      key: filter.key,
      label: filter.label,
      value,
      displayValue: displayValue || value?.toString() || '',
    };

    setActiveFilters(prev => {
      const existingIndex = prev.findIndex(f => f.key === filter.key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newFilter;
        return updated;
      }
      return [...prev, newFilter];
    });
    setIsFilterPopoverOpen(false);
  }, []);

  const removeFilter = useCallback((filterKey: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== filterKey));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
  }, []);

  const renderFilterInput = (filter: SearchFilter) => {
    const IconComponent = filter.icon;

    switch (filter.type) {
      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {filter.label}
            </label>
            <Select onValueChange={(value) => {
              const option = filter.options?.find(opt => opt.value === value);
              addFilter(filter, value, option?.label);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'text':
      case 'number':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {filter.label}
            </label>
            <Input
              type={filter.type}
              placeholder={filter.placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) {
                    addFilter(filter, value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {filter.label}
            </label>
            <CalendarComponent
              mode="single"
              onSelect={(date) => {
                if (date) {
                  addFilter(filter, date, date.toLocaleDateString());
                }
              }}
              className="rounded-md border"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Filter Button */}
        {availableFilters.length > 0 && (
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Add Filters</h3>
                  {activeFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {availableFilters.map((filter) => (
                    <div key={filter.key}>
                      {renderFilterInput(filter)}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="text-xs font-medium">{filter.label}:</span>
              <span className="text-xs">{filter.displayValue}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}