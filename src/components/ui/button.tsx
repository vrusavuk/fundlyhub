import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Exact Stripe button styles
        default: "bg-[#635BFF] text-white hover:bg-[#5851EA] font-semibold",
        secondary: "bg-[#E3E8EE] text-[#0A2540] hover:bg-[#D1D9E0] font-medium",
        outline: "border border-[#E3E8EE] bg-white text-[#0A2540] hover:bg-[#FAFBFC]",
        destructive: "bg-[#DF1B41] text-white hover:bg-[#C71739] font-semibold",
        ghost: "hover:bg-[#FAFBFC] text-[#0A2540]",
        link: "text-[#635BFF] underline-offset-4 hover:underline",
        // Legacy variants for backward compatibility
        hero: "bg-gradient-hero text-white hover:opacity-90 shadow-medium font-semibold",
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-soft",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-soft",
      },
      size: {
        default: "h-9 px-4 rounded-md",
        sm: "h-8 px-3 rounded-md text-xs",
        lg: "h-10 px-6 rounded-md",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
