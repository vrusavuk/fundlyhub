/**
 * Stripe Dashboard Table Component
 * Matches Stripe's clean, borderless table design with sticky column support
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface StripeTableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Enable sticky column support with proper border-collapse */
  enableColumnPinning?: boolean;
}

const StripeTable = React.forwardRef<HTMLTableElement, StripeTableProps>(
  ({ className, enableColumnPinning = false, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full text-sm", className)}
        style={enableColumnPinning ? { borderCollapse: 'separate', borderSpacing: 0 } : undefined}
        {...props}
      />
    </div>
  )
);
StripeTable.displayName = "StripeTable";

const StripeTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-border", className)}
    {...props}
  />
));
StripeTableHeader.displayName = "StripeTableHeader";

const StripeTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-border", className)} {...props} />
));
StripeTableBody.displayName = "StripeTableBody";

const StripeTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("font-medium", className)}
    {...props}
  />
));
StripeTableFooter.displayName = "StripeTableFooter";

const StripeTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { density?: 'compact' | 'comfortable' | 'spacious' }
>(({ className, density = 'comfortable', ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={cn(
        "transition-colors hover:bg-muted/40 group",
        "data-[state=selected]:bg-muted/50",
        className
      )}
      {...props}
    />
  );
});
StripeTableRow.displayName = "StripeTableRow";

interface StripeTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  density?: 'compact' | 'comfortable' | 'spacious';
  isPinned?: boolean;
}

const StripeTableHead = React.forwardRef<HTMLTableCellElement, StripeTableHeadProps>(
  ({ className, density = 'comfortable', isPinned = false, style, ...props }, ref) => {
    const paddingClasses = {
      compact: 'py-2 px-3',
      comfortable: 'py-3 px-4',
      spacious: 'py-4 px-5',
    };

    return (
      <th
        ref={ref}
        className={cn(
          paddingClasses[density],
          "text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide",
          "first:pl-0 last:pr-0",
          "[&:has([role=checkbox])]:w-12 [&:has([role=checkbox])]:pl-0",
          // Pinned columns need explicit background to cover scrolling content
          isPinned && "bg-background",
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);
StripeTableHead.displayName = "StripeTableHead";

interface StripeTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  density?: 'compact' | 'comfortable' | 'spacious';
  isPinned?: boolean;
}

const StripeTableCell = React.forwardRef<HTMLTableCellElement, StripeTableCellProps>(
  ({ className, density = 'comfortable', isPinned = false, style, ...props }, ref) => {
    const paddingClasses = {
      compact: 'py-3 px-3',
      comfortable: 'py-4 px-4',
      spacious: 'py-5 px-5',
    };

    return (
      <td
        ref={ref}
        className={cn(
          paddingClasses[density],
          "align-middle text-foreground",
          "first:pl-0 last:pr-0",
          "[&:has([role=checkbox])]:w-12 [&:has([role=checkbox])]:pl-0",
          // Pinned columns need solid opaque backgrounds (not semi-transparent)
          isPinned && "bg-card group-hover:bg-muted group-data-[state=selected]:bg-muted",
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);
StripeTableCell.displayName = "StripeTableCell";

const StripeTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
StripeTableCaption.displayName = "StripeTableCaption";

export {
  StripeTable,
  StripeTableHeader,
  StripeTableBody,
  StripeTableFooter,
  StripeTableHead,
  StripeTableRow,
  StripeTableCell,
  StripeTableCaption,
};
