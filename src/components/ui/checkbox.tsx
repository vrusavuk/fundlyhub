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
      // Base - Square with minimal rounding (Stripe style)
      "peer h-4 w-4 shrink-0 rounded-[3px]",
      
      // Stripe colors
      "border-[1.5px] border-[#E3E8EE]",
      "bg-white dark:bg-background",
      
      // Smooth transitions
      "transition-all duration-200 ease-in-out",
      
      // Hover state
      "hover:border-[#0073E6]",
      
      // Checked state - Stripe blue
      "data-[state=checked]:bg-[#0073E6]",
      "data-[state=checked]:border-[#0073E6]",
      "data-[state=checked]:text-white",
      
      // Indeterminate state
      "data-[state=indeterminate]:bg-[#0073E6]",
      "data-[state=indeterminate]:border-[#0073E6]",
      "data-[state=indeterminate]:text-white",
      
      // Focus ring
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-[#0073E6]/20",
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
