/**
 * EXACT Stripe Dashboard Data Table
 * Replicates Stripe's table design with pixel-perfect accuracy
 * Supports sticky first/last columns with shadow effects
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
import { getColumnPinningStyles } from "@/lib/data-table/column-pinning-styles";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  selectedRows?: Record<string, boolean>;
  onSelectionChange?: (selection: Record<string, boolean>) => void;
  enableSelection?: boolean;
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  /** Pin first column (after checkbox if selection enabled) to the left */
  pinFirstColumn?: boolean;
  /** Pin last column (typically actions) to the right */
  pinLastColumn?: boolean;
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState(selectedRows || {});

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
      // Find the actions column (typically has id: 'actions')
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
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onSelectionChange?.(newSelection);
    },
    state: {
      sorting,
      rowSelection,
      columnPinning,
    },
    enableColumnPinning,
  });

  return (
    <div className={cn("bg-card", className)}>
      <StripeTable enableColumnPinning={enableColumnPinning}>
        <StripeTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <StripeTableRow key={headerGroup.id} density={density} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const isPinned = header.column.getIsPinned();
                const pinningStyles = enableColumnPinning 
                  ? getColumnPinningStyles(header.column, true) 
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
                    ? getColumnPinningStyles(cell.column, false) 
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
      </StripeTable>
    </div>
  );
}
