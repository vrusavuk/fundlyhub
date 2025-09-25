import * as React from "react";
import { 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState,
  PaginationState 
} from '@tanstack/react-table';

// Table state management hook
export interface TableStateConfig {
  initialPageSize?: number;
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
  initialVisibility?: VisibilityState;
  initialGlobalFilter?: string;
}

export interface TableState {
  // State
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  pagination: PaginationState;
  globalFilter: string;
  rowSelection: Record<string, boolean>;
  
  // Actions
  setSorting: (sorting: SortingState) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
  setPagination: (pagination: PaginationState) => void;
  setGlobalFilter: (filter: string) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  
  // Utilities
  resetFilters: () => void;
  resetAll: () => void;
  getStateSnapshot: () => TableStateSnapshot;
  restoreStateSnapshot: (snapshot: TableStateSnapshot) => void;
}

export interface TableStateSnapshot {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  pagination: PaginationState;
  globalFilter: string;
  timestamp: number;
}

export function useTableState(config: TableStateConfig = {}): TableState {
  const {
    initialPageSize = 25,
    initialSorting = [],
    initialFilters = [],
    initialVisibility = {},
    initialGlobalFilter = '',
  } = config;

  // Core state
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibility);
  const [globalFilter, setGlobalFilter] = React.useState<string>(initialGlobalFilter);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Reset functions
  const resetFilters = React.useCallback(() => {
    setColumnFilters(initialFilters);
    setGlobalFilter(initialGlobalFilter);
  }, [initialFilters, initialGlobalFilter]);

  const resetAll = React.useCallback(() => {
    setSorting(initialSorting);
    setColumnFilters(initialFilters);
    setColumnVisibility(initialVisibility);
    setGlobalFilter(initialGlobalFilter);
    setRowSelection({});
    setPagination({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
  }, [initialSorting, initialFilters, initialVisibility, initialGlobalFilter, initialPageSize]);

  // State persistence
  const getStateSnapshot = React.useCallback((): TableStateSnapshot => ({
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
    globalFilter,
    timestamp: Date.now(),
  }), [sorting, columnFilters, columnVisibility, pagination, globalFilter]);

  const restoreStateSnapshot = React.useCallback((snapshot: TableStateSnapshot) => {
    setSorting(snapshot.sorting);
    setColumnFilters(snapshot.columnFilters);
    setColumnVisibility(snapshot.columnVisibility);
    setPagination(snapshot.pagination);
    setGlobalFilter(snapshot.globalFilter);
  }, []);

  return React.useMemo(() => ({
    // State
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
    globalFilter,
    rowSelection,
    
    // Actions
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setPagination,
    setGlobalFilter,
    setRowSelection,
    
    // Utilities
    resetFilters,
    resetAll,
    getStateSnapshot,
    restoreStateSnapshot,
  }), [
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
    globalFilter,
    rowSelection,
    resetFilters,
    resetAll,
    getStateSnapshot,
    restoreStateSnapshot,
  ]);
}

// Debounced search hook
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300
): [string, string, (value: string) => void] {
  const [searchValue, setSearchValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);

  // Debounce the search value
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchValue, delay]);

  return [searchValue, debouncedValue, setSearchValue];
}

// URL state persistence hook (optional)
export function useTableUrlState(
  key: string = 'table',
  enabled: boolean = false
) {
  const updateUrl = React.useCallback((state: Partial<TableStateSnapshot>) => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    // Store compressed state in URL
    params.set(key, btoa(JSON.stringify(state)));
    
    // Update URL without reload
    window.history.replaceState(
      {},
      '',
      `${url.pathname}?${params.toString()}`
    );
  }, [key, enabled]);

  const loadFromUrl = React.useCallback((): Partial<TableStateSnapshot> | null => {
    if (!enabled) return null;

    try {
      const params = new URLSearchParams(window.location.search);
      const stateStr = params.get(key);
      
      if (!stateStr) return null;
      
      return JSON.parse(atob(stateStr));
    } catch {
      return null;
    }
  }, [key, enabled]);

  return { updateUrl, loadFromUrl };
}