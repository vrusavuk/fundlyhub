import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { StripeCardExact } from '@/components/ui/stripe-card-exact';
import { StripeBadgeExact } from '@/components/ui/stripe-badge-exact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const hasActiveFilters = activeFilters.length > 0 || Object.values(values).some(v => v && v !== 'all' && v !== '');

  return (
    <StripeCardExact className={className}>
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-semibold text-[#425466] uppercase tracking-[0.5px]">
            {title}
          </h3>
          
          {hasActiveFilters && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-[#425466] hover:text-[#0A2540] h-8"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Active Filters Pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map((filter) => (
              <StripeBadgeExact
                key={`${filter.key}-${filter.value}`}
                variant="neutral"
                className="flex items-center gap-1"
              >
                <span>{filter.label}: {filter.value}</span>
                <button
                  onClick={() => onChange(filter.key, '')}
                  className="ml-1 hover:bg-[#0A2540]/10 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </StripeBadgeExact>
            ))}
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key} className="flex-1 min-w-[200px]">
              {filter.type === 'search' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#425466]" />
                  <Input
                    placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="h-9 pl-10 text-[14px] border-[#E3E8EE] focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
                  />
                </div>
              )}

              {filter.type === 'select' && filter.options && (
                <Select
                  value={values[filter.key] || 'all'}
                  onValueChange={(value) => onChange(filter.key, value)}
                >
                  <SelectTrigger className="h-9 text-[14px] border-[#E3E8EE] focus:border-[#635BFF]">
                    <SelectValue placeholder={filter.placeholder || `All ${filter.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="border-[#E3E8EE]">
                    {filter.options.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-[14px]"
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
    </StripeCardExact>
  );
}