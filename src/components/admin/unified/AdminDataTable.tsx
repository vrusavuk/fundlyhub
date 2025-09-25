import { useState, useEffect } from 'react';
import { 
  ColumnDef, 
  Row, 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState 
} from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { AdminTableControls, BulkAction, TableAction } from './AdminTableControls';
import { AdminContentContainer } from './AdminContentContainer';
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
  
  // Styling
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  
  // Pagination
  pageSizeOptions?: number[];
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
  className,
  density = 'comfortable',
  pageSizeOptions = [10, 25, 50, 100]
}: AdminDataTableProps<TData, TValue>) {
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
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onRowClick={onRowClick}
          enableSelection={enableSelection}
          enableSorting={enableSorting}
          enableFiltering={enableFiltering}
          enableColumnVisibility={enableColumnVisibility}
          enablePagination={enablePagination}
          searchPlaceholder={searchPlaceholder}
          emptyStateTitle={emptyStateTitle}
          emptyStateDescription={emptyStateDescription}
          onSelectionChange={handleSelectionChange}
          density={density}
          pageSizeOptions={pageSizeOptions}
          className="border-none shadow-none"
        />
      </div>
    </AdminContentContainer>
  );
}