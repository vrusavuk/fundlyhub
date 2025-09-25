import React, { useState, useMemo, useCallback } from "react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTypographyClasses, getSpacingClasses } from "@/lib/design/typography";

// Enhanced column definition 
export type EnhancedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    priority?: 'high' | 'medium' | 'low' | 'hidden';
    searchable?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    minWidth?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    className?: string;
  };
};

// Enhanced filter definition
export interface EnhancedFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';
  options?: { label: string; value: string }[];
  placeholder?: string;
  columnId?: string;
}

// Table density options
export type TableDensity = 'compact' | 'comfortable' | 'spacious';

// Props interface
interface EnhancedDataTableProps<TData, TValue> {
  columns: EnhancedColumnDef<TData, TValue>[];
  data: TData[];
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  retry?: () => void;

  // Search and filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  globalFilter?: boolean;
  filters?: EnhancedFilter[];

  // Selection
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  selectedRows?: TData[];

  // Sorting and pagination
  enableSorting?: boolean;
  enablePagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;

  // Column visibility
  enableColumnVisibility?: boolean;
  hiddenColumns?: string[];

  // Mobile optimization
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileCardRenderer?: (row: Row<TData>) => React.ReactNode;
  
  // Styling
  className?: string;
  density?: TableDensity;
  
  // Row interactions
  onRowClick?: (row: Row<TData>) => void;
  rowClassName?: (row: Row<TData>) => string;

  // Custom toolbar
  toolbar?: React.ReactNode;
  
  // Virtual scrolling (for large datasets)
  virtualized?: boolean;
  estimatedRowHeight?: number;
}

const densityClasses = {
  compact: 'py-1 px-2 text-xs',
  comfortable: 'py-2 px-3 text-sm',
  spacious: 'py-3 px-4 text-base',
};

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  error = null,
  empty = false,
  emptyTitle = "No data found",
  emptyDescription = "No results match your current criteria.",
  retry,
  searchable = true,
  searchPlaceholder = "Search...",
  globalFilter = true,
  filters = [],
  enableSelection = false,
  onSelectionChange,
  selectedRows = [],
  enableSorting = true,
  enablePagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  enableColumnVisibility = true,
  hiddenColumns = [],
  mobileBreakpoint = 'md',
  mobileCardRenderer,
  className,
  density = 'comfortable',
  onRowClick,
  rowClassName,
  toolbar,
  virtualized = false,
  estimatedRowHeight = 50,
}: EnhancedDataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    hiddenColumns.reduce((acc, col) => ({ ...acc, [col]: false }), {})
  );
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Enhanced mobile column filtering based on priority
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns;
    
    return columns.filter(col => {
      const priority = col.meta?.priority || 'medium';
      return priority === 'high' || priority === 'medium';
    });
  }, [columns, isMobile]);

  // Search functionality
  const searchableColumns = columns.filter(col => {
    return col.meta?.searchable !== false;
  });

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    return data.filter((row: any) => {
      return searchableColumns.some(col => {
        // Access the cell value using the column's accessor
        let value: any = null;
        
        if ('accessorKey' in col && col.accessorKey) {
          value = row[col.accessorKey as string];
        } else if ('accessorFn' in col && col.accessorFn) {
          value = col.accessorFn(row, 0);
        } else if ('id' in col && col.id) {
          value = row[col.id];
        }
        
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, searchableColumns]);

  // React Table setup
  const table = useReactTable({
    data: filteredData,
    columns: visibleColumns as ColumnDef<TData, any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: globalFilterValue,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  // Handle selection changes
  const selectedRowData = useMemo(() => {
    const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
    return selectedRowsData;
  }, [table, rowSelection]);

  React.useEffect(() => {
    if (onSelectionChange && selectedRowData) {
      onSelectionChange(selectedRowData);
    }
  }, [selectedRowData, onSelectionChange]);

  // Mobile card rendering
  if (isMobile && mobileCardRenderer) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Mobile Search */}
        {searchable && (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{error}</p>
              {retry && (
                <Button variant="outline" onClick={retry}>
                  Try Again
                </Button>
              )}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold">{emptyTitle}</h3>
              <p className="text-muted-foreground">{emptyDescription}</p>
            </div>
          ) : (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "cursor-pointer",
                  rowClassName?.(row),
                  onRowClick && "hover:bg-accent/50 transition-colors"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {mobileCardRenderer(row)}
              </div>
            ))
          )}
        </div>

        {/* Mobile Pagination */}
        {enablePagination && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Header */}
      <div className="flex items-center justify-between">
        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[300px] pl-9"
              />
            </div>
          )}
        </div>

        {/* Table Controls */}
        <div className="flex items-center space-x-2">
          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Custom toolbar */}
          {toolbar}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-background">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-2">{error}</p>
            {retry && (
              <Button variant="outline" onClick={retry}>
                Try Again
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const meta = column.columnDef.meta as {
                      priority?: 'high' | 'medium' | 'low' | 'hidden';
                      searchable?: boolean;
                      filterable?: boolean;
                      sortable?: boolean;
                      minWidth?: number;
                      maxWidth?: number;
                      align?: 'left' | 'center' | 'right';
                      className?: string;
                    };
                    
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          densityClasses[density],
                          meta?.className,
                          meta?.align === 'center' && 'text-center',
                          meta?.align === 'right' && 'text-right'
                        )}
                        style={{
                          minWidth: meta?.minWidth,
                          maxWidth: meta?.maxWidth,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div className={cn(
                            "flex items-center space-x-2",
                            meta?.align === 'center' && 'justify-center',
                            meta?.align === 'right' && 'justify-end'
                          )}>
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {enableSorting && column.getCanSort() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                              >
                                {column.getIsSorted() === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : column.getIsSorted() === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      rowClassName?.(row),
                      onRowClick && "cursor-pointer hover:bg-accent/50"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as {
                        priority?: 'high' | 'medium' | 'low' | 'hidden';
                        searchable?: boolean;
                        filterable?: boolean;
                        sortable?: boolean;
                        minWidth?: number;
                        maxWidth?: number;
                        align?: 'left' | 'center' | 'right';
                        className?: string;
                      };
                      
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            densityClasses[density],
                            meta?.className,
                            meta?.align === 'center' && 'text-center',
                            meta?.align === 'right' && 'text-right'
                          )}
                          style={{
                            minWidth: meta?.minWidth,
                            maxWidth: meta?.maxWidth,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-24 text-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{emptyTitle}</h3>
                      <p className="text-muted-foreground">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}