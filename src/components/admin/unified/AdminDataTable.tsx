import { useState, useEffect } from 'react';
import { 
  ColumnDef, 
  Row, 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState 
} from '@tanstack/react-table';
import { EnhancedDataTable, ServerPaginationState } from '@/components/ui/enhanced-data-table';
import { AdminTableControls, BulkAction, TableAction } from './AdminTableControls';
import { AdminContentContainer } from './AdminContentContainer';
import { UserMobileCard, CampaignMobileCard, OrganizationMobileCard } from '@/components/ui/mobile-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  // Mobile card renderer
  mobileCardType?: 'user' | 'campaign' | 'organization';
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  
  // Pagination
  pageSizeOptions?: number[];
  // Server-side pagination
  paginationState?: ServerPaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
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
  mobileCardType,
  className,
  density = 'comfortable',
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
  
  return (
    <AdminContentContainer
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyTitle={emptyStateTitle}
      emptyDescription={emptyStateDescription}
      retry={retry}
      className={className}
    >
      <div className="space-y-4">
        {/* Table Controls */}
        <AdminTableControls
          title={title}
          selectedCount={currentSelection.length}
          totalCount={data.length}
          actions={actions}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          onClearSelection={clearSelection}
          loading={loading}
        />
        
        {/* Data Table */}
        <EnhancedDataTable
          columns={columns}
          data={data}
          loading={loading}
          onRowClick={onRowClick}
          enableSelection={enableSelection}
          enableSorting={enableSorting}
          enableColumnVisibility={enableColumnVisibility}
          enablePagination={enablePagination}
          searchPlaceholder={searchPlaceholder}
          emptyTitle={emptyStateTitle}
          emptyDescription={emptyStateDescription}
          onSelectionChange={handleSelectionChange}
          density={density}
          pageSizeOptions={pageSizeOptions}
          className="border-none shadow-none"
          searchable={enableFiltering}
          serverPagination={paginationState}
          onServerPageChange={onPageChange}
          onServerPageSizeChange={onPageSizeChange}
        />
      </div>
    </AdminContentContainer>
  );
}