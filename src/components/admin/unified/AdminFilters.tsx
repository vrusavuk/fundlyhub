import { ReactNode } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/design/typography';

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
  const hasActiveFilters = activeFilters.length > 0 || Object.values(values).some(v => v && v !== 'all' && v !== '');

  return (
    <Card className={cn('shadow-soft border-primary/10', className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            getTypographyClasses('heading', 'sm', 'text-foreground'),
            'flex items-center gap-2'
          )}>
            <Filter className="h-4 w-4" />
            {title}
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeFilters.length || Object.values(values).filter(v => v && v !== 'all' && v !== '').length}
              </Badge>
            )}
          </h3>
          
          {hasActiveFilters && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Active Filters Pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.key}-${filter.value}`}
                variant="secondary"
                className="text-xs px-2 py-1 flex items-center gap-1"
              >
                <span>{filter.label}: {filter.value}</span>
                <button
                  onClick={() => onChange(filter.key, '')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <label className={cn(
                getTypographyClasses('caption', 'md', 'text-foreground'),
                'font-medium'
              )}>
                {filter.label}
              </label>
              
              {filter.type === 'search' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="pl-10 shadow-soft border-primary/10 focus:border-primary/20"
                  />
                </div>
              )}

              {filter.type === 'select' && filter.options && (
                <Select
                  value={values[filter.key] || 'all'}
                  onValueChange={(value) => onChange(filter.key, value)}
                >
                  <SelectTrigger className="shadow-soft border-primary/10 focus:border-primary/20">
                    <SelectValue placeholder={filter.placeholder || `All ${filter.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="shadow-medium bg-background/95 backdrop-blur-sm">
                    <SelectItem value="all" className="hover:bg-primary/5">
                      All {filter.label}
                    </SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="hover:bg-primary/5"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filter.type === 'custom' && filter.component}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}