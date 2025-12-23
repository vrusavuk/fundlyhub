/**
 * EXACT Stripe Dashboard Data Table
 * Replicates Stripe's table design with pixel-perfect accuracy
 * Supports sticky first/last columns with scroll-aware shadow effects
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  Row,
  ColumnPinningState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  StripeTable,
  StripeTableBody,
  StripeTableCell,
  StripeTableHead,
  StripeTableHeader,
  StripeTableRow,
} from "@/components/ui/stripe-table";
import { Checkbox } from "@/components/ui/checkbox";
import { getColumnPinningStyles, type ScrollState } from "@/lib/data-table/column-pinning-styles";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  selectedRows?: Record<string, boolean>;
  onSelectionChange?: (selection: Record<string, boolean>) => void;
  enableSelection?: boolean;
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  /** Pin first column (checkbox) to the left */
  pinFirstColumn?: boolean;
  /** Pin last column (actions) to the right */
  pinLastColumn?: boolean;
  /** External sorting state for server-side sorting */
  sorting?: SortingState;
  /** Callback when sorting changes (for server-side sorting) */
  onSortingChange?: (sorting: SortingState) => void;
  /** Whether sorting is handled server-side (disables client-side sorting) */
  manualSorting?: boolean;
  /** Show column visibility toggle */
  showColumnVisibility?: boolean;
}

export function DataTableExact<TData, TValue>({
  columns,
  data,
  onRowClick,
  selectedRows,
  onSelectionChange,
  enableSelection = false,
  className,
  density = 'comfortable',
  pinFirstColumn = false,
  pinLastColumn = false,
  sorting: externalSorting,
  onSortingChange,
  manualSorting = false,
  showColumnVisibility = false,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState(selectedRows || {});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [scrollState, setScrollState] = React.useState<ScrollState>({
    isScrolledLeft: false,
    isScrolledRight: false,
  });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Use external sorting if provided, otherwise use internal
  const sorting = externalSorting !== undefined ? externalSorting : internalSorting;
  const setSorting = onSortingChange || setInternalSorting;

  // Track horizontal scroll position
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      
      setScrollState({
        isScrolledLeft: scrollLeft > 0,
        isScrolledRight: scrollLeft < maxScroll - 1, // -1 for rounding tolerance
      });
    };

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Sync external selection state
  React.useEffect(() => {
    if (selectedRows) {
      setRowSelection(selectedRows);
    }
  }, [selectedRows]);

  // Build columns with selection if enabled
  const tableColumns = React.useMemo(() => {
    if (!enableSelection) return columns;

    return [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        size: 48,
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ];
  }, [columns, enableSelection]);

  // Calculate column pinning state based on props
  const columnPinning = React.useMemo<ColumnPinningState>(() => {
    const state: ColumnPinningState = { left: [], right: [] };
    
    if (!pinFirstColumn && !pinLastColumn) return state;
    
    // Pin ONLY the select/checkbox column to the left
    if (pinFirstColumn && enableSelection) {
      state.left = ['select'];
    }
    
    // Pin ONLY the actions column to the right
    if (pinLastColumn) {
      const actionsCol = tableColumns.find(col => col.id === 'actions');
      if (actionsCol) {
        state.right = ['actions'];
      }
    }
    
    return state;
  }, [tableColumns, pinFirstColumn, pinLastColumn, enableSelection]);

  const enableColumnPinning = pinFirstColumn || pinLastColumn;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onSelectionChange?.(newSelection);
    },
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnPinning,
      columnVisibility,
    },
    enableColumnPinning,
  });

  // Check if any columns are hidden
  const hasHiddenColumns = table.getAllColumns().some(col => !col.getIsVisible() && col.getCanHide());

  return (
    <div className={cn("bg-card", className)}>
      {/* Column visibility controls - show when enabled or when columns are hidden */}
      {(showColumnVisibility || hasHiddenColumns) && (
        <div className="flex items-center justify-end py-2 px-4 border-b border-border/50">
          <DataTableViewOptions table={table} />
        </div>
      )}
      <div ref={scrollContainerRef} className="w-full overflow-auto">
        <table
          className="w-full text-sm"
          style={enableColumnPinning ? { borderCollapse: 'separate', borderSpacing: 0 } : undefined}
        >
          <StripeTableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <StripeTableRow key={headerGroup.id} density={density} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  const pinningStyles = enableColumnPinning 
                    ? getColumnPinningStyles(header.column, true, scrollState) 
                    : {};
                  
                  return (
                    <StripeTableHead 
                      key={header.id} 
                      density={density}
                      isPinned={!!isPinned}
                      style={pinningStyles}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </StripeTableHead>
                  );
                })}
              </StripeTableRow>
            ))}
          </StripeTableHeader>
          <StripeTableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <StripeTableRow
                  key={row.id}
                  density={density}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned();
                    const pinningStyles = enableColumnPinning 
                      ? getColumnPinningStyles(cell.column, false, scrollState) 
                      : {};
                    
                    return (
                      <StripeTableCell 
                        key={cell.id} 
                        density={density}
                        isPinned={!!isPinned}
                        style={pinningStyles}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </StripeTableCell>
                    );
                  })}
                </StripeTableRow>
              ))
            ) : (
              <StripeTableRow density={density} className="hover:bg-transparent">
                <StripeTableCell
                  density={density}
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </StripeTableCell>
              </StripeTableRow>
            )}
          </StripeTableBody>
        </table>
      </div>
    </div>
  );
}
