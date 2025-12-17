/**
 * Status Badge Component
 * Uses semantic design tokens for consistent status indicators
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stripeBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-status-success text-status-success-foreground",
        warning: "bg-status-warning text-status-warning-foreground",
        error: "bg-status-error text-status-error-foreground",
        info: "bg-status-info text-status-info-foreground",
        neutral: "bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface StripeBadgeExactProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stripeBadgeVariants> {}

function StripeBadgeExact({ className, variant, ...props }: StripeBadgeExactProps) {
  return (
    <div className={cn(stripeBadgeVariants({ variant }), className)} {...props} />
  );
}

export { StripeBadgeExact, stripeBadgeVariants };
