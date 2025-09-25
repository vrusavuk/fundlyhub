import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

// Selection column factory
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
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
    size: 40,
  };
}

// Text column factory
export function createTextColumn<TData>(
  accessorKey: string,
  title: string,
  options?: {
    sortable?: boolean;
    hideable?: boolean;
    truncate?: boolean;
    maxLength?: number;
  }
): ColumnDef<TData> {
  const { sortable = true, hideable = true, truncate = false, maxLength = 50 } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (truncate && value && value.length > maxLength) {
        return (
          <span title={value}>
            {value.substring(0, maxLength)}...
          </span>
        );
      }
      return <span>{value}</span>;
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Date column factory
export function createDateColumn<TData>(
  accessorKey: string,
  title: string,
  dateFormat: string = "MMM dd, yyyy",
  options?: {
    sortable?: boolean;
    hideable?: boolean;
    showTime?: boolean;
  }
): ColumnDef<TData> {
  const { sortable = true, hideable = true, showTime = false } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ getValue }) => {
      const date = getValue() as string | Date;
      if (!date) return <span className="text-muted-foreground">-</span>;
      
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return (
        <div className="flex flex-col">
          <span>{format(dateObj, dateFormat)}</span>
          {showTime && (
            <span className="text-xs text-muted-foreground">
              {format(dateObj, "HH:mm")}
            </span>
          )}
        </div>
      );
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Status badge column factory
export function createStatusColumn<TData>(
  accessorKey: string,
  title: string,
  statusConfig: Record<string, { label: string; variant: any; className?: string }>,
  options?: {
    sortable?: boolean;
    hideable?: boolean;
  }
): ColumnDef<TData> {
  const { sortable = true, hideable = true } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const config = statusConfig[status];
      
      if (!config) {
        return <Badge variant="outline">{status}</Badge>;
      }

      return (
        <Badge 
          variant={config.variant} 
          className={config.className}
        >
          {config.label}
        </Badge>
      );
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Currency column factory
export function createCurrencyColumn<TData>(
  accessorKey: string,
  title: string,
  currency: string = "USD",
  options?: {
    sortable?: boolean;
    hideable?: boolean;
    showFullAmount?: boolean;
  }
): ColumnDef<TData> {
  const { sortable = true, hideable = true, showFullAmount = false } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ getValue }) => {
      const amount = getValue() as number;
      if (amount === null || amount === undefined) {
        return <span className="text-muted-foreground">-</span>;
      }

      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: showFullAmount ? "standard" : "compact",
        compactDisplay: "short",
      });

      return (
        <span className="font-medium">
          {formatter.format(amount)}
        </span>
      );
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Avatar column factory
export function createAvatarColumn<TData>(
  accessorKey: string,
  title: string,
  nameKey?: string,
  emailKey?: string,
  options?: {
    sortable?: boolean;
    hideable?: boolean;
    showEmail?: boolean;
  }
): ColumnDef<TData> {
  const { sortable = true, hideable = true, showEmail = true } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ row }) => {
      const avatar = row.getValue(accessorKey) as string;
      const name = nameKey ? row.getValue(nameKey) as string : "";
      const email = emailKey ? row.getValue(emailKey) as string : "";

      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-xs">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name || "Unknown"}</span>
            {showEmail && email && (
              <span className="text-xs text-muted-foreground">{email}</span>
            )}
          </div>
        </div>
      );
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Boolean column factory
export function createBooleanColumn<TData>(
  accessorKey: string,
  title: string,
  options?: {
    sortable?: boolean;
    hideable?: boolean;
    trueLabel?: string;
    falseLabel?: string;
    showIcons?: boolean;
  }
): ColumnDef<TData> {
  const { 
    sortable = true, 
    hideable = true, 
    trueLabel = "Yes", 
    falseLabel = "No",
    showIcons = true 
  } = options || {};

  return {
    accessorKey,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={title} />
    ),
    cell: ({ getValue }) => {
      const value = getValue() as boolean;
      
      return (
        <div className="flex items-center space-x-2">
          {showIcons && (
            value ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )
          )}
          <span className={value ? "text-success" : "text-muted-foreground"}>
            {value ? trueLabel : falseLabel}
          </span>
        </div>
      );
    },
    enableSorting: sortable,
    enableHiding: hideable,
  };
}

// Actions column factory
export function createActionsColumn<TData>(
  actions: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (row: TData) => void;
    variant?: "default" | "destructive";
    hidden?: (row: TData) => boolean;
  }>,
  options?: {
    hideable?: boolean;
  }
): ColumnDef<TData> {
  const { hideable = false } = options || {};

  return {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const data = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions
              .filter(action => !action.hidden || !action.hidden(data))
              .map((action, index) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(data)}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: hideable,
    size: 40,
  };
}