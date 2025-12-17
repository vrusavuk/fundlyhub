import { ReactNode, useState } from 'react';
import { Search, X, ChevronDown, Calendar, DollarSign, Filter } from 'lucide-react';
import { StripeBadgeExact } from '@/components/ui/stripe-badge-exact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'search' | 'select' | 'date' | 'range' | 'custom';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  component?: ReactNode;
}

interface AdminFiltersProps {
  title?: string;
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear?: () => void;
  activeFilters?: Array<{ key: string; label: string; value: string }>;
  className?: string;
  collapsible?: boolean;
}

export function AdminFilters({
  title = "Filters",
  filters,
  values,
  onChange,
  onClear,
  activeFilters = [],
  className,
  collapsible = false
}: AdminFiltersProps) {
  const [openPills, setOpenPills] = useState<Record<string, boolean>>({});
  const hasActiveFilters = activeFilters.length > 0 || Object.values(values).some(v => v && v !== 'all' && v !== '');

  const getFilterIcon = (type: string) => {
    switch(type) {
      case 'search': return Search;
      case 'date': return Calendar;
      case 'range': return DollarSign;
      default: return Filter;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Filter Pills */}
      {filters.map((filter) => {
        const Icon = getFilterIcon(filter.type);
        const isActive = values[filter.key] && values[filter.key] !== 'all' && values[filter.key] !== '';
        const isOpen = openPills[filter.key];

        if (filter.type === 'custom' && filter.component) {
          return <div key={filter.key}>{filter.component}</div>;
        }

        return (
          <Popover 
            key={filter.key}
            open={isOpen}
            onOpenChange={(open) => setOpenPills({ ...openPills, [filter.key]: open })}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 px-3 text-sm border-border hover:border-primary hover:bg-muted',
                  isActive && 'border-primary bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {filter.label}
                {isActive && (
                  <StripeBadgeExact variant="info" className="ml-2 h-4 px-1.5 text-[10px]">
                    1
                  </StripeBadgeExact>
                )}
                <ChevronDown className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4 border-border" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {filter.label}
                  </h4>
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onChange(filter.key, '');
                        setOpenPills({ ...openPills, [filter.key]: false });
                      }}
                      className="h-7 px-2 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {filter.type === 'search' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                      value={values[filter.key] || ''}
                      onChange={(e) => onChange(filter.key, e.target.value)}
                      className="h-9 pl-10 text-sm border-border"
                    />
                  </div>
                )}

                {filter.type === 'select' && filter.options && (
                  <Select
                    value={values[filter.key] || 'all'}
                    onValueChange={(value) => {
                      onChange(filter.key, value);
                      setOpenPills({ ...openPills, [filter.key]: false });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-border">
                      <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="border-border">
                      {filter.options.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-sm"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Clear All Button */}
      {hasActiveFilters && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
