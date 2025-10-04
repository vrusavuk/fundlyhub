import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ColumnDef } from "@tanstack/react-table";
import { EnhancedColumnDef } from "@/components/ui/enhanced-data-table";
import { cn } from "@/lib/utils";
import { MoneyMath } from "@/lib/enterprise/utils/MoneyMath";

// Standard table utility functions

export function tableCn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Column priority utilities for mobile responsiveness
export const ColumnPriority = {
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const, 
  LOW: 'low' as const,
  HIDDEN: 'hidden' as const,
};

export function createResponsiveColumn<TData, TValue>(
  column: ColumnDef<TData, TValue>,
  options: {
    priority?: 'high' | 'medium' | 'low' | 'hidden';
    minWidth?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    searchable?: boolean;
    sortable?: boolean;
    className?: string;
  } = {}
): EnhancedColumnDef<TData, TValue> {
  return {
    ...column,
    meta: {
      priority: options.priority || 'medium',
      minWidth: options.minWidth,
      maxWidth: options.maxWidth,
      align: options.align || 'left',
      searchable: options.searchable !== false,
      sortable: options.sortable !== false,
      className: options.className,
      ...column.meta,
    },
  };
}

export function createDateColumn<TData>(
  accessorKey: string,
  label: string,
  options: {
    format?: 'date' | 'datetime' | 'relative';
    priority?: 'high' | 'medium' | 'low' | 'hidden';
  } = {}
): EnhancedColumnDef<TData, unknown> {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    
    switch (options.format) {
      case 'datetime':
        return date.toLocaleString();
      case 'relative':
        return getRelativeTime(date);
      default:
        return date.toLocaleDateString();
    }
  };

  return createResponsiveColumn(
    {
      id: accessorKey,
      accessorKey,
      header: label,
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      priority: options.priority || 'low',
      minWidth: 100,
      maxWidth: 150,
      searchable: false,
    }
  );
}

export function createStatusColumn<TData>(
  accessorKey: string,
  label: string,
  statusConfig: Record<string, { 
    label: string; 
    variant: 'default' | 'secondary' | 'destructive' | 'outline' 
  }>,
  options: {
    priority?: 'high' | 'medium' | 'low' | 'hidden';
  } = {}
): EnhancedColumnDef<TData, unknown> {
  return createResponsiveColumn(
    {
      id: accessorKey,
      accessorKey,
      header: label,
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const config = statusConfig[status] || { label: status, variant: 'outline' as const };
        
        return status;
      },
      filterFn: (row, id, value) => {
        if (!value || value === 'all') return true;
        return row.getValue(id) === value;
      },
    },
    {
      priority: options.priority || 'high',
      minWidth: 80,
      maxWidth: 120,
    }
  );
}

export function createCurrencyColumn<TData>(
  accessorKey: string,
  label: string,
  currency: string = 'USD',
  options: {
    priority?: 'high' | 'medium' | 'low' | 'hidden';
  } = {}
): EnhancedColumnDef<TData, unknown> {
  return createResponsiveColumn(
    {
      id: accessorKey,
      accessorKey,
      header: label,
      cell: ({ getValue }) => {
        const value = getValue() as number | null | undefined;
        if (value === null || value === undefined) return '-';
        return MoneyMath.format(MoneyMath.create(value, currency));
      },
    },
    {
      priority: options.priority || 'medium',
      minWidth: 80,
      maxWidth: 120,
      align: 'right',
    }
  );
}

// Utility functions
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

// Export utilities for easier imports
export const TableUtils = {
  createResponsiveColumn,
  createDateColumn,
  createStatusColumn,
  createCurrencyColumn,
  ColumnPriority,
};