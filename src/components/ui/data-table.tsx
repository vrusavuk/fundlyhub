import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  SortAsc,
  SortDesc,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getTypographyClasses, getSpacingClasses } from "@/lib/design/typography";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
  className?: string;
  pageSizeOptions?: number[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  onRowClick,
  enableSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  searchPlaceholder = "Search...",
  searchColumn,
  className,
  pageSizeOptions = [10, 20, 50, 100],
  emptyStateTitle = "No data found",
  emptyStateDescription = "No results match your current filters.",
  density = 'comfortable',
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: enableSelection,
  });

  // Notify parent about selection changes
  React.useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, enableSelection, table]);

  const densityClasses = {
    compact: "text-xs",
    comfortable: "text-sm",
    spacious: "text-base",
  };

  const cellPadding = {
    compact: "px-3 py-2",      // Stripe-like: 12px horizontal, 8px vertical
    comfortable: "px-4 py-3",
    spacious: "px-6 py-4",
  };

  const rowHeight = {
    compact: "h-10",           // Stripe standard: 40px
    comfortable: "h-12",
    spacious: "h-14",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn(getSpacingClasses('section', 'md'), className)}>
      {/* Stripe-inspired Table Controls */}
      {(enableFiltering || enableSelection || enableColumnVisibility) && (
        <div className="bg-card border border-border rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-3">
              {enableFiltering && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="pl-10 h-9 w-[200px] lg:w-[300px] text-sm"
                  />
                </div>
              )}
              {enableSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center space-x-3 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md">
                  <Badge variant="secondary" className="text-xs">
                    {table.getFilteredSelectedRowModel().rows.length} selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => table.resetRowSelection()}
                    className="h-7 px-2 text-xs hover:bg-primary/10"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {enableColumnVisibility && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 shadow-soft border-primary/10 hover:bg-primary/5 hover:border-primary/20"
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px] shadow-medium bg-background/95 backdrop-blur-sm border-primary/10">
                    <DropdownMenuLabel className={getTypographyClasses('caption', 'md')}>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllColumns()
                      .filter(
                        (column) =>
                          typeof column.accessorFn !== "undefined" && column.getCanHide()
                      )
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize text-sm hover:bg-primary/5"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id.replace('_', ' ')}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stripe-inspired Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-2 border-border bg-muted/30">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className={cn(
                        cellPadding[density],
                        "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                        "sticky top-0 z-10 bg-muted/50 backdrop-blur-sm",
                        header.column.getCanSort() && "cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <div className="flex flex-col opacity-60 hover:opacity-100 transition-opacity">
                            {header.column.getIsSorted() === "desc" ? (
                              <SortDesc className="h-3 w-3 text-primary" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <SortAsc className="h-3 w-3 text-primary" />
                            ) : (
                              <div className="h-3 w-3">
                                <SortAsc className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    rowHeight[density],
                    "border-b border-border transition-colors duration-200",
                    onRowClick && "cursor-pointer hover:bg-muted/30",
                    row.getIsSelected() && "bg-primary/10 hover:bg-primary/15",
                    index % 2 === 1 && "bg-muted/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={cn(
                        cellPadding[density],
                        "text-sm text-foreground"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center bg-muted/10"
                >
                  <div className={cn(
                    "flex flex-col items-center justify-center",
                    getSpacingClasses('content', 'lg')
                  )}>
                    <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className={getTypographyClasses('heading', 'sm', 'text-muted-foreground')}>
                      {emptyStateTitle}
                    </p>
                    {emptyStateDescription && (
                      <p className={cn(
                        getTypographyClasses('body', 'md', 'text-muted-foreground/70'),
                        "mt-1"
                      )}>
                        {emptyStateDescription}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stripe-inspired Pagination */}
      {enablePagination && (
        <div className="bg-card border border-border rounded-lg p-3 mt-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className={cn(
              "flex-1",
              getTypographyClasses('body', 'md', 'text-muted-foreground')
            )}>
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span className="inline-flex items-center space-x-1">
                  <Badge variant="secondary" className="text-xs">
                    {table.getFilteredSelectedRowModel().rows.length}
                  </Badge>
                  <span>of {table.getFilteredRowModel().rows.length} selected</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <p className={getTypographyClasses('caption', 'md')}>Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-9 w-[70px] shadow-soft border-primary/10">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top" className="shadow-medium bg-background/95 backdrop-blur-sm">
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`} className="hover:bg-primary/5">
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className={cn(
                "flex items-center justify-center px-3 py-1.5 bg-muted/30 rounded-md",
                getTypographyClasses('caption', 'md')
              )}>
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-soft border-primary/10 hover:bg-primary/5"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-soft border-primary/10 hover:bg-primary/5"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-soft border-primary/10 hover:bg-primary/5"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 shadow-soft border-primary/10 hover:bg-primary/5"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}