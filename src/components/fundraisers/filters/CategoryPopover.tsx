import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import type { Category } from '@/types/category';
import type { FilterState } from '@/types/filters';

interface CategoryPopoverProps {
  filters: FilterState;
  categories: Category[];
  onCategoryToggle: (categoryName: string) => void;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  hasCategoryFilters: () => boolean;
}

export function CategoryPopover({
  filters,
  categories,
  onCategoryToggle,
  onFilterChange,
  hasCategoryFilters
}: CategoryPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`w-[90px] sm:w-[180px] justify-between transition-all duration-200 flex-shrink-0 ${
            hasCategoryFilters() 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent hover:text-accent-foreground"
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
                onClick={() => onFilterChange('categories', [])}
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
                  onCheckedChange={() => onCategoryToggle(category.name)}
                />
                <Label 
                  htmlFor={`category-${category.id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                >
                  <span>{category.name}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}