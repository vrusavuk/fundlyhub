/**
 * EXACT Stripe Dashboard Table Component
 * Replicates Stripe's table design with pixel-perfect accuracy
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
      className={cn("w-full border-collapse", className)}
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
    className={cn("bg-white border-b border-[#E3E8EE]", className)}
    {...props}
  />
));
StripeTableHeader.displayName = "StripeTableHeader";

const StripeTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("bg-white", className)} {...props} />
));
StripeTableBody.displayName = "StripeTableBody";

const StripeTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-[#E3E8EE] bg-white font-medium", className)}
    {...props}
  />
));
StripeTableFooter.displayName = "StripeTableFooter";

const StripeTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { density?: 'compact' | 'comfortable' | 'spacious' }
>(({ className, density = 'comfortable', ...props }, ref) => {
  const heightClasses = {
    compact: 'h-[36px]',
    comfortable: 'h-[44px]',
    spacious: 'h-[52px]',
  };
  
  return (
    <tr
      ref={ref}
      className={cn(
        heightClasses[density],
        "border-b border-[#E3E8EE] transition-colors hover:bg-[#FAFBFC]",
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
  const heightClasses = {
    compact: 'h-[36px] px-3 text-[11px]',
    comfortable: 'h-[44px] px-4 text-[12px]',
    spacious: 'h-[52px] px-5 text-[13px]',
  };
  
  return (
    <th
      ref={ref}
      className={cn(
        heightClasses[density],
        "text-left align-middle font-semibold uppercase tracking-[0.5px] text-[#425466]",
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
  const heightClasses = {
    compact: 'h-[36px] px-3 text-[13px]',
    comfortable: 'h-[44px] px-4 text-[14px]',
    spacious: 'h-[52px] px-5 text-[15px]',
  };
  
  return (
    <td
      ref={ref}
      className={cn(
        heightClasses[density],
        "align-middle font-normal text-[#0A2540]",
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
    className={cn("mt-4 text-sm text-[#425466]", className)}
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
