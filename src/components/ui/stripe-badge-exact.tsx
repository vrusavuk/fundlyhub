/**
 * EXACT Stripe Dashboard Badge Component
 * Replicates Stripe's badge design with exact colors
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stripeBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-[#00D924] text-white",
        warning: "bg-[#FFC043] text-[#0A2540]",
        error: "bg-[#DF1B41] text-white",
        info: "bg-[#635BFF] text-white",
        neutral: "bg-[#E3E8EE] text-[#0A2540]",
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
