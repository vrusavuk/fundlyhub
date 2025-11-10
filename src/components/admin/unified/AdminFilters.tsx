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
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
              className="text-slate-600 hover:text-slate-900 h-8 px-2"
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
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key} className="flex-1 min-w-[200px]">
              {filter.type === 'search' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="pl-10 h-9 text-sm border-slate-200"
                  />
                </div>
              )}

              {filter.type === 'select' && filter.options && (
                <Select
                  value={values[filter.key] || 'all'}
                  onValueChange={(value) => onChange(filter.key, value)}
                >
                  <SelectTrigger className="h-9 text-sm border-slate-200">
                    <SelectValue placeholder={filter.placeholder || `All ${filter.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
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

              {filter.type === 'custom' && filter.component}
            </div>
          ))}
        </div>
    </div>
  );
}