import { useState, useEffect, ReactNode } from 'react';
import { 
  ColumnDef, 
  Row, 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState 
} from '@tanstack/react-table';
import { DataTableExact } from '@/components/admin/data-table-exact';
import { StripeCardExact } from '@/components/ui/stripe-card-exact';
import { StripePagination } from '@/components/ui/StripePagination';
import { AdminTableControls, BulkAction, TableAction } from './AdminTableControls';
import { AdminContentContainer } from './AdminContentContainer';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface ServerPaginationState {
  page: number;
  pageSize: number;
  totalCount?: number;
  totalPages?: number;
}

interface AdminDataTableProps<TData, TValue> {
  // Core table props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  
  // Admin-specific props
  title?: string;
  selectedRows?: TData[];
  onSelectionChange?: (selectedRows: TData[]) => void;
  onRowClick?: (row: Row<TData>) => void;
  
  // Actions
  actions?: TableAction[];
  bulkActions?: BulkAction[];
  onBulkAction?: (actionKey: string, selectedRows: TData[]) => void;
  
  // Enhanced features
  searchPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  error?: string | null;
  retry?: () => void;
  
  // Table configuration
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  
  // Mobile card renderer - render custom card for each data item on mobile
  mobileCardRenderer?: (item: TData, index: number) => ReactNode;
  
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  
  // Column pinning for sticky columns
  /** Pin first column to left with shadow on horizontal scroll */
  pinFirstColumn?: boolean;
  /** Pin last column (actions) to right with shadow on horizontal scroll */
  pinLastColumn?: boolean;
  
  // Pagination
  pageSizeOptions?: number[];
  // Server-side pagination
  paginationState?: ServerPaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

// Mobile card list skeleton
function MobileCardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-5 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  title,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  actions = [],
  bulkActions = [],
  onBulkAction,
  searchPlaceholder = "Search...",
  emptyStateTitle = "No data found",
  emptyStateDescription = "No results match your current criteria.",
  error = null,
  retry,
  enableSelection = true,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  mobileCardRenderer,
  className,
  density = 'comfortable',
  pinFirstColumn = false,
  pinLastColumn = false,
  pageSizeOptions = [10, 25, 50, 100],
  paginationState,
  onPageChange,
  onPageSizeChange
}: AdminDataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [internalSelection, setInternalSelection] = useState<TData[]>([]);
  
  // Use external selection if provided, otherwise internal
  const currentSelection = selectedRows.length > 0 ? selectedRows : internalSelection;
  
  const handleSelectionChange = (newSelection: TData[]) => {
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    } else {
      setInternalSelection(newSelection);
    }
  };
  
  const handleBulkAction = (actionKey: string) => {
    onBulkAction?.(actionKey, currentSelection);
  };
  
  const clearSelection = () => {
    handleSelectionChange([]);
  };

  // Convert selection to row IDs for DataTableExact
  const convertSelectionToRowIds = (selection: TData[]): Record<string, boolean> => {
    const rowIds: Record<string, boolean> = {};
    selection.forEach((item, index) => {
      rowIds[String(index)] = true;
    });
    return rowIds;
  };

  // Handle selection change from DataTableExact
  const handleDataTableSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    const selectedData = data.filter((_, index) => selectedRowIds[String(index)]);
    handleSelectionChange(selectedData);
  };

  // Handle mobile card click - create a pseudo-row object
  const handleMobileCardClick = (item: TData, index: number) => {
    if (onRowClick) {
      // Create a minimal Row object for compatibility
      const pseudoRow = {
        original: item,
        index,
        id: String(index),
      } as Row<TData>;
      onRowClick(pseudoRow);
    }
  };
  
  // Render mobile card list
  const renderMobileCards = () => {
    if (loading) {
      return <MobileCardListSkeleton count={5} />;
    }

    if (data.length === 0) {
      return null; // Let AdminContentContainer handle empty state
    }

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => handleMobileCardClick(item, index)}
          >
            {mobileCardRenderer!(item, index)}
          </div>
        ))}
      </div>
    );
  };

  // Mobile view with cards
  if (isMobile && mobileCardRenderer) {
    return (
      <AdminContentContainer
        loading={false}
        error={error}
        empty={!loading && !error && data.length === 0}
        emptyTitle={emptyStateTitle}
        emptyDescription={emptyStateDescription}
        retry={retry}
        className={cn('w-full', className)}
      >
        <div className="space-y-4 w-full">
          {/* Table Controls - simplified for mobile */}
          <AdminTableControls
            title={title}
            selectedCount={currentSelection.length}
            totalCount={paginationState?.totalCount || data.length}
            actions={actions}
            bulkActions={bulkActions}
            onBulkAction={handleBulkAction}
            onClearSelection={clearSelection}
            loading={loading}
          />
          
          {/* Mobile Card List */}
          {renderMobileCards()}

          {/* Pagination Controls - show when there's data */}
          {enablePagination && paginationState && onPageChange && onPageSizeChange && (paginationState.totalCount || 0) > 0 && (
            <div className="border-t border-border pt-4">
              <StripePagination
                page={paginationState.page}
                pageSize={paginationState.pageSize}
                totalItems={paginationState.totalCount || 0}
                totalPages={paginationState.totalPages || 1}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          )}
        </div>
      </AdminContentContainer>
    );
  }
  
  // Desktop view with table - Show loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-4 w-full max-w-full', className)}>
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }
  
  return (
    <AdminContentContainer
      loading={false}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyTitle={emptyStateTitle}
      emptyDescription={emptyStateDescription}
      retry={retry}
      className={cn('w-full max-w-full', className)}
    >
      <div className="space-y-4 w-full max-w-full overflow-x-hidden">
        {/* Table Controls */}
        <AdminTableControls
          title={title}
          selectedCount={currentSelection.length}
          totalCount={paginationState?.totalCount || data.length}
          actions={actions}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          onClearSelection={clearSelection}
          loading={loading}
        />
        
        {/* Data Table with responsive wrapper */}
        <div className="w-full overflow-x-auto">
          {/* Stripe-like: no outer perimeter border around the table, only inner row dividers */}
          <StripeCardExact noPadding borderless>
            <DataTableExact
              columns={columns}
              data={data}
              onRowClick={onRowClick}
              enableSelection={enableSelection}
              selectedRows={convertSelectionToRowIds(currentSelection)}
              onSelectionChange={handleDataTableSelectionChange}
              density={density}
              pinFirstColumn={pinFirstColumn}
              pinLastColumn={pinLastColumn}
            />

            {/* Pagination Controls - show when there's data */}
            {enablePagination && paginationState && onPageChange && onPageSizeChange && (paginationState.totalCount || 0) > 0 && (
              <StripePagination
                page={paginationState.page}
                pageSize={paginationState.pageSize}
                totalItems={paginationState.totalCount || 0}
                totalPages={paginationState.totalPages || 1}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </StripeCardExact>
        </div>
      </div>
    </AdminContentContainer>
  );
}