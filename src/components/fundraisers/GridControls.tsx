/**
 * Grid controls for filtering, sorting, and view mode switching
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import { 
  Grid3X3, 
  List, 
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'newest' | 'trending' | 'amount' | 'deadline';

interface GridControlsProps {
  totalCount: number;
  searchQuery?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  className?: string;
}

export function GridControls({
  totalCount,
  searchQuery,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className
}: GridControlsProps) {
  const handleViewModeChange = (mode: ViewMode) => {
    onViewModeChange(mode);
    hapticFeedback.light();
  };

  const handleSortChange = (sort: SortBy) => {
    onSortChange(sort);
    hapticFeedback.light();
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {totalCount} fundraiser{totalCount !== 1 ? 's' : ''}
          </Badge>
          {searchQuery && (
            <Badge variant="secondary" className="font-medium">
              Results for "{searchQuery}"
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Options */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('newest')}
              className="text-xs h-8"
            >
              <Clock className="w-3 h-3 mr-1" />
              Newest
            </Button>
            <Button
              variant={sortBy === 'trending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('trending')}
              className="text-xs h-8"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Button>
            <Button
              variant={sortBy === 'amount' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('amount')}
              className="text-xs h-8"
            >
              <Target className="w-3 h-3 mr-1" />
              Amount
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="p-2 h-8 w-8"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="p-2 h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}