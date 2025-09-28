import { Badge } from '@/components/ui/badge';
import type { FilterState } from '@/types';

interface ActiveFiltersBadgesProps {
  filters: FilterState;
  getActiveFiltersCount: () => number;
}

export function ActiveFiltersBadges({ filters, getActiveFiltersCount }: ActiveFiltersBadgesProps) {
  if (getActiveFiltersCount() === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-2 ml-auto">
      <span className="text-xs text-muted-foreground">Active:</span>
      <div className="flex gap-1">
        {filters.categories.slice(0, 1).map((category) => (
          <Badge key={category} variant="secondary" className="text-xs py-0 px-2 h-6">
            {category}
          </Badge>
        ))}
        {filters.categories.length > 1 && (
          <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
            +{filters.categories.length - 1} more
          </Badge>
        )}
        {filters.location !== 'All locations' && (
          <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
            📍 {filters.location.slice(0, 8)}
          </Badge>
        )}
        {(filters.nonprofitsOnly || filters.closeToGoal) && (
          <Badge variant="secondary" className="text-xs py-0 px-2 h-6">
            +filters
          </Badge>
        )}
      </div>
    </div>
  );
}