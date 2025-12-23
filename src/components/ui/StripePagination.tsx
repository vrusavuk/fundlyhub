/**
 * Stripe-inspired pagination component
 * Clean, minimal design with comprehensive navigation
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface StripePaginationProps {
  page: number; // 1-indexed
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  /** Show first/last page buttons */
  showFirstLast?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  className?: string;
}

export function StripePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showFirstLast = true,
  compact = false,
  className,
}: StripePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const canGoFirst = page > 1;
  const canGoLast = page < totalPages;

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    onPageSizeChange(newSize);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border bg-background",
        compact ? "px-4 py-2" : "px-6 py-3",
        className
      )}
    >
      {/* Left: Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Rows per page
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className={cn("text-sm", compact ? "h-7 w-[60px]" : "h-8 w-[70px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Center: Page Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden md:inline">
          Page <span className="font-medium text-foreground">{page}</span> of{' '}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>
        <span className="hidden md:inline text-border">•</span>
        <span>
          <span className="font-medium text-foreground">{startItem}</span>
          {startItem !== endItem && (
            <>
              {' - '}
              <span className="font-medium text-foreground">{endItem}</span>
            </>
          )}
          {' of '}
          <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span>
        </span>
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
            onClick={() => onPageChange(1)}
            disabled={!canGoFirst}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(compact ? "h-7 w-7" : "h-8 w-8")}
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoLast}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
