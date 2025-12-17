import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base - Square with minimal rounding
      "peer h-4 w-4 shrink-0 rounded-[3px]",
      
      // Border and background using design tokens
      "border-[1.5px] border-border",
      "bg-card",
      
      // Smooth transitions
      "transition-all duration-200 ease-in-out",
      
      // Hover state
      "hover:border-primary",
      
      // Checked state - Primary color
      "data-[state=checked]:bg-primary",
      "data-[state=checked]:border-primary",
      "data-[state=checked]:text-primary-foreground",
      
      // Indeterminate state
      "data-[state=indeterminate]:bg-primary",
      "data-[state=indeterminate]:border-primary",
      "data-[state=indeterminate]:text-primary-foreground",
      
      // Focus ring
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring/20",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background",
      
      // Disabled
      "disabled:cursor-not-allowed",
      "disabled:opacity-40",
      
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      {props.checked === "indeterminate" ? (
        <Minus className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
