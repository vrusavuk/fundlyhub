/**
 * Stripe Dashboard Table Component
 * Matches Stripe's clean, minimal table design
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const StripeTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full border-collapse text-sm", className)}
      {...props}
    />
  </div>
));
StripeTable.displayName = "StripeTable";

const StripeTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-muted/30 border-b border-border", className)}
    {...props}
  />
));
StripeTableHeader.displayName = "StripeTableHeader";

const StripeTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("bg-card divide-y divide-border", className)} {...props} />
));
StripeTableBody.displayName = "StripeTableBody";

const StripeTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-border bg-muted/30 font-medium", className)}
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
        "transition-colors hover:bg-muted/50 group",
        "data-[state=selected]:bg-primary/5",
        className
      )}
      {...props}
    />
  );
});
StripeTableRow.displayName = "StripeTableRow";

const StripeTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { density?: 'compact' | 'comfortable' | 'spacious' }
>(({ className, density = 'comfortable', ...props }, ref) => {
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
        "text-left align-middle font-medium text-muted-foreground text-xs",
        "first:pl-4 last:pr-4",
        "[&:has([role=checkbox])]:w-12 [&:has([role=checkbox])]:pl-4",
        className
      )}
      {...props}
    />
  );
});
StripeTableHead.displayName = "StripeTableHead";

const StripeTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { density?: 'compact' | 'comfortable' | 'spacious' }
>(({ className, density = 'comfortable', ...props }, ref) => {
  const paddingClasses = {
    compact: 'py-2 px-3',
    comfortable: 'py-3 px-4',
    spacious: 'py-4 px-5',
  };
  
  return (
    <td
      ref={ref}
      className={cn(
        paddingClasses[density],
        "align-middle text-foreground",
        "first:pl-4 last:pr-4",
        "[&:has([role=checkbox])]:w-12 [&:has([role=checkbox])]:pl-4",
        className
      )}
      {...props}
    />
  );
});
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
