/**
 * EXACT Stripe Dashboard Data Table
 * Replicates Stripe's table design with pixel-perfect accuracy
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: Row<TData>) => void;
  selectedRows?: Record<string, boolean>;
  onSelectionChange?: (selection: Record<string, boolean>) => void;
  enableSelection?: boolean;
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
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
    },
  });

  return (
    <div className={cn("bg-card", className)}>
      <StripeTable>
        <StripeTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <StripeTableRow key={headerGroup.id} density={density} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <StripeTableHead key={header.id} density={density}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </StripeTableHead>
              ))}
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
                {row.getVisibleCells().map((cell) => (
                  <StripeTableCell key={cell.id} density={density}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </StripeTableCell>
                ))}
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
