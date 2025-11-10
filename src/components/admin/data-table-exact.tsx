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
}

export function DataTableExact<TData, TValue>({
  columns,
  data,
  onRowClick,
  selectedRows,
  onSelectionChange,
  enableSelection = false,
  className,
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
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
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
    <div className={cn("bg-white border border-[#E3E8EE] rounded-lg overflow-hidden", className)}>
      <StripeTable>
        <StripeTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <StripeTableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <StripeTableHead key={header.id}>
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
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  onRowClick && "cursor-pointer",
                  row.getIsSelected() && "bg-[#F6F9FC]"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <StripeTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </StripeTableCell>
                ))}
              </StripeTableRow>
            ))
          ) : (
            <StripeTableRow>
              <StripeTableCell
                colSpan={tableColumns.length}
                className="h-24 text-center text-[#425466]"
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
