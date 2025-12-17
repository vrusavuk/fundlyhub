import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary action button
        default: "bg-primary text-primary-foreground hover:bg-primary-hover font-semibold",
        // Secondary/subtle button
        secondary: "bg-secondary text-secondary-foreground hover:bg-neutral-200 font-medium",
        // Outline button
        outline: "border border-border bg-background text-foreground hover:bg-muted",
        // Destructive/danger button
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold",
        // Ghost button (minimal)
        ghost: "hover:bg-muted text-foreground",
        // Link style button
        link: "text-primary underline-offset-4 hover:underline",
        // Hero/CTA gradient button
        hero: "bg-gradient-hero text-white hover:opacity-90 shadow-standard font-semibold",
        // Accent button
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-minimal",
        // Success button
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-minimal",
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
