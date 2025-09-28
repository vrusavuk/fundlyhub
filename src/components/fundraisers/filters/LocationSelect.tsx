import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import type { FilterState } from '@/types';
import { LOCATIONS } from '@/types';

interface LocationSelectProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
}

export function LocationSelect({ filters, onFilterChange }: LocationSelectProps) {
  const hasLocationFilter = filters.location !== 'All locations' || filters.locationInput.trim() !== '';

  return (
    <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
      <SelectTrigger 
        className={`w-[80px] sm:w-[160px] transition-all duration-200 flex-shrink-0 !border-0 focus:ring-0 focus:ring-offset-0 ${
          hasLocationFilter
            ? "bg-accent text-accent-foreground" 
            : "bg-background hover:bg-accent hover:text-accent-foreground"
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
  );
}