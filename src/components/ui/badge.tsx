import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border-border hover:bg-muted/50",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90 shadow-sm",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
        // Stripe-inspired subtle variants
        'stripe-success': "bg-status-success-light text-status-success-foreground ring-1 ring-inset ring-status-success-border",
        'stripe-warning': "bg-status-warning-light text-status-warning-foreground ring-1 ring-inset ring-status-warning-border",
        'stripe-error': "bg-status-error-light text-status-error-foreground ring-1 ring-inset ring-status-error-border",
        'stripe-info': "bg-status-info-light text-status-info-foreground ring-1 ring-inset ring-status-info-border",
        'stripe-neutral': "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
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
