import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary badge
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        // Secondary/muted badge
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-neutral-200",
        // Destructive/error badge
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline badge
        outline: "text-foreground border-border hover:bg-muted",
        // Success badge
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90",
        // Warning badge
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        // Status badges with subtle backgrounds
        'status-success': "bg-status-success-light text-status-success ring-1 ring-inset ring-status-success-border",
        'status-warning': "bg-status-warning-light text-status-warning-foreground ring-1 ring-inset ring-status-warning-border",
        'status-error': "bg-status-error-light text-status-error ring-1 ring-inset ring-status-error-border",
        'status-info': "bg-status-info-light text-status-info ring-1 ring-inset ring-status-info-border",
        'status-neutral': "bg-muted text-foreground ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
