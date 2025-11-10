import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#635BFF] text-white hover:bg-[#5851EA]",
        secondary: "border-transparent bg-[#E3E8EE] text-[#0A2540] hover:bg-[#D1D9E0]",
        destructive: "border-transparent bg-[#DF1B41] text-white hover:bg-[#C71739]",
        outline: "text-[#0A2540] border-[#E3E8EE] hover:bg-[#FAFBFC]",
        success: "border-transparent bg-[#00D924] text-white hover:bg-[#00C020]",
        warning: "border-transparent bg-[#FFC043] text-[#0A2540] hover:bg-[#F0B030]",
        // Stripe-inspired subtle variants
        'stripe-success': "bg-[#00D924]/10 text-[#00D924] ring-1 ring-inset ring-[#00D924]/20",
        'stripe-warning': "bg-[#FFC043]/10 text-[#8B6A00] ring-1 ring-inset ring-[#FFC043]/20",
        'stripe-error': "bg-[#DF1B41]/10 text-[#DF1B41] ring-1 ring-inset ring-[#DF1B41]/20",
        'stripe-info': "bg-[#635BFF]/10 text-[#635BFF] ring-1 ring-inset ring-[#635BFF]/20",
        'stripe-neutral': "bg-[#E3E8EE] text-[#0A2540] ring-1 ring-inset ring-[#E3E8EE]",
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
