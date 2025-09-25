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
  Column,
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
  Filter,
  X,
  MoreHorizontal,
  Eye,
  EyeOff,
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
  DropdownMenuItem,
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
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTypographyClasses, getSpacingClasses } from "@/lib/design/typography";

// Enhanced column definition with mobile priorities
export interface EnhancedColumnDef<TData, TValue> extends ColumnDef<TData, TValue> {
  meta?: ColumnDef<TData, TValue>['meta'] & {
    priority?: 'high' | 'medium' | 'low' | 'hidden'; // Mobile display priority
    searchable?: boolean; // Whether this column is searchable
    filterable?: boolean; // Whether this column can be filtered
    sortable?: boolean; // Whether this column can be sorted
    minWidth?: number; // Minimum width for the column
    maxWidth?: number; // Maximum width for the column
    align?: 'left' | 'center' | 'right'; // Text alignment
    className?: string; // Custom CSS classes
  };
}

// Enhanced filter definition
export interface TableFilter {
  id: string;
  label: string;
  type: 'search' | 'select' | 'date' | 'range';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

// Enhanced data table props
interface EnhancedDataTableProps<TData, TValue> {
  columns: EnhancedColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  
  // Row interactions
  onRowClick?: (row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  
  // Features
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  enableGlobalSearch?: boolean;
  enableColumnFilters?: boolean;
  
  // Search and filters
  searchPlaceholder?: string;
  globalSearch?: string;
  onGlobalSearchChange?: (search: string) => void;
  filters?: TableFilter[];
  filterValues?: Record<string, any>;
  onFilterChange?: (filterId: string, value: any) => void;
  
  // Selection
  selectedRows?: TData[];
  onSelectionChange?: (selectedRows: TData[]) => void;
  
  // Appearance
  density?: 'compact' | 'comfortable' | 'spacious';
  variant?: 'default' | 'minimal' | 'bordered';
  stickyHeader?: boolean;
  
  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Empty states
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
  
  // Mobile
  mobileBreakpoint?: number;
  mobileCardView?: boolean;
  mobileCardRenderer?: (item: TData, index: number) => React.ReactNode;
  
  // Styling
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  onRowClick,
  onRowDoubleClick,
  enableSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  enableGlobalSearch = true,
  enableColumnFilters = true,
  searchPlaceholder = "Search...",
  globalSearch: externalGlobalSearch,
  onGlobalSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  selectedRows: externalSelectedRows,
  onSelectionChange,
  density = 'comfortable',
  variant = 'default',
  stickyHeader = false,
  pageSize: externalPageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalCount,
  currentPage: externalCurrentPage,
  onPageChange,
  onPageSizeChange,
  emptyStateTitle = "No data found",
  emptyStateDescription = "No results match your current criteria.",
  emptyStateAction,
  mobileBreakpoint = 768,
  mobileCardView = true,
  mobileCardRenderer,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
}: EnhancedDataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  
  // Internal state for uncontrolled mode
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [searchDebounce, setSearchDebounce] = React.useState("");
  
  // Debounce global search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onGlobalSearchChange) {
        onGlobalSearchChange(searchDebounce);
      } else {
        setGlobalFilter(searchDebounce);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchDebounce, onGlobalSearchChange]);
  
  // Mobile column visibility management
  React.useEffect(() => {
    if (isMobile) {
      const mobileVisibility: VisibilityState = {};
      columns.forEach((col) => {
        const colId = col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : '');
        if (colId) {
          const priority = col.meta?.priority || 'medium';
          mobileVisibility[colId] = priority === 'high' || priority === 'medium';
        }
      });
      setColumnVisibility(mobileVisibility);
    } else {
      // Reset visibility on desktop
      const desktopVisibility: VisibilityState = {};
      columns.forEach((col) => {
        const colId = col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : '');
        if (colId) {
          const priority = col.meta?.priority || 'medium';
          desktopVisibility[colId] = priority !== 'hidden';
        }
      });
      setColumnVisibility(desktopVisibility);
    }
  }, [isMobile, columns]);
  
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
      globalFilter: externalGlobalSearch ?? globalFilter,
    },
    enableRowSelection: enableSelection,
    initialState: {
      pagination: {
        pageSize: externalPageSize || 25,
      },
    },
  });
  
  // Handle selection changes
  React.useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, enableSelection, table]);
  
  // Density classes
  const densityClasses = {
    compact: "text-xs",
    comfortable: "text-sm",
    spacious: "text-base",
  };
  
  const cellPadding = {
    compact: "px-2 py-1",
    comfortable: "px-3 py-2",
    spacious: "px-4 py-3",
  };
  
  // Variant classes
  const variantClasses = {
    default: "border border-border shadow-soft",
    minimal: "border-0",
    bordered: "border-2 border-border",
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Mobile card view
  if (isMobile && mobileCardView && mobileCardRenderer) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Mobile search and filters */}
        {(enableGlobalSearch || filters.length > 0) && (
          <div className="space-y-3">
            {enableGlobalSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchDebounce}
                  onChange={(e) => setSearchDebounce(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex-1 min-w-[120px]">
                    {filter.type === 'select' && (
                      <Select
                        value={filterValues[filter.id] || 'all'}
                        onValueChange={(value) => onFilterChange?.(filter.id, value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={filter.placeholder || filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {filter.label}</SelectItem>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Mobile cards */}
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{emptyStateDescription}</p>
              {emptyStateAction && (
                <Button
                  variant="outline"
                  onClick={emptyStateAction.onClick}
                  className="mt-4"
                >
                  {emptyStateAction.label}
                </Button>
              )}
            </div>
          ) : (
            data.map((item, index) => (
              <div
                key={index}
                className="card-enhanced p-4 cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => onRowClick?.(table.getRow(index.toString()))}
              >
                {mobileCardRenderer(item, index)}
              </div>
            ))
          )}
        </div>
        
        {/* Mobile pagination */}
        {enablePagination && data.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} results
            </p>
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
          </div>
        )}
      </div>
    );
  }
  
  // Desktop table view
  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced table controls */}
      {(enableGlobalSearch || enableColumnFilters || enableColumnVisibility || filters.length > 0) && (
        <div className="card-enhanced p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              {enableGlobalSearch && (
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchDebounce}
                    onChange={(e) => setSearchDebounce(e.target.value)}
                    className="pl-10 shadow-soft border-primary/10 focus:border-primary/20"
                  />
                  {searchDebounce && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchDebounce("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              
              {/* Quick filters */}
              {filters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <div key={filter.id}>
                      {filter.type === 'select' && (
                        <Select
                          value={filterValues[filter.id] || 'all'}
                          onValueChange={(value) => onFilterChange?.(filter.id, value)}
                        >
                          <SelectTrigger className="h-9 w-40 shadow-soft border-primary/10">
                            <SelectValue placeholder={filter.placeholder || filter.label} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All {filter.label}</SelectItem>
                            {filter.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {enableSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md">
                  <Badge variant="secondary" className="text-xs">
                    {table.getFilteredSelectedRowModel().rows.length} selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => table.resetRowSelection()}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {enableColumnVisibility && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shadow-soft">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
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
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {column.id.replace('_', ' ')}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced table */}
      <div className={cn("rounded-lg overflow-hidden", variantClasses[variant])}>
        <div className="overflow-x-auto">
          <Table className={tableClassName}>
            <TableHeader className={cn(stickyHeader && "sticky top-0 z-10", headerClassName)}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className={cn(
                        cellPadding[density],
                        getTypographyClasses('caption', 'md', 'text-foreground'),
                        "font-semibold",
                        header.column.getCanSort() && "cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      )}
                      style={{
                        minWidth: header.column.columnDef.meta?.minWidth,
                        maxWidth: header.column.columnDef.meta?.maxWidth,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={cn(
                        "flex items-center space-x-2",
                        header.column.columnDef.meta?.align === 'center' && "justify-center",
                        header.column.columnDef.meta?.align === 'right' && "justify-end"
                      )}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <div className="flex flex-col opacity-60 hover:opacity-100">
                            {header.column.getIsSorted() === "desc" ? (
                              <SortDesc className="h-3 w-3 text-primary" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <SortAsc className="h-3 w-3 text-primary" />
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className={bodyClassName}>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "border-b border-border/50 transition-colors duration-200",
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      row.getIsSelected() && "bg-primary/10 hover:bg-primary/15",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className={cn(
                          cellPadding[density],
                          densityClasses[density],
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.align === 'center' && "text-center",
                          cell.column.columnDef.meta?.align === 'right' && "text-right"
                        )}
                        style={{
                          minWidth: cell.column.columnDef.meta?.minWidth,
                          maxWidth: cell.column.columnDef.meta?.maxWidth,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">{emptyStateTitle}</p>
                        <p className="text-sm text-muted-foreground/70">{emptyStateDescription}</p>
                      </div>
                      {emptyStateAction && (
                        <Button variant="outline" onClick={emptyStateAction.onClick}>
                          {emptyStateAction.label}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Enhanced pagination */}
      {enablePagination && (
        <div className="card-enhanced p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {enableSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {table.getFilteredSelectedRowModel().rows.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    of {table.getFilteredRowModel().rows.length} selected
                  </span>
                </>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <p className="text-sm">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
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