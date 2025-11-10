/**
 * EXACT Stripe Dashboard Card Component
 * Replicates Stripe's card design - NO shadows, clean borders
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StripeCardExactProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const StripeCardExact = React.forwardRef<HTMLDivElement, StripeCardExactProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-[#E3E8EE] rounded-lg",
          !noPadding && "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StripeCardExact.displayName = "StripeCardExact";

const StripeCardExactHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between pb-4 border-b border-[#E3E8EE] mb-4", className)}
      {...props}
    />
  );
});
StripeCardExactHeader.displayName = "StripeCardExactHeader";

const StripeCardExactTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-[16px] font-semibold text-[#0A2540]", className)}
      {...props}
    />
  );
});
StripeCardExactTitle.displayName = "StripeCardExactTitle";

const StripeCardExactContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("", className)} {...props} />;
});
StripeCardExactContent.displayName = "StripeCardExactContent";

const StripeCardExactFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 border-t border-[#E3E8EE] mt-4", className)}
      {...props}
    />
  );
});
StripeCardExactFooter.displayName = "StripeCardExactFooter";

export {
  StripeCardExact,
  StripeCardExactHeader,
  StripeCardExactTitle,
  StripeCardExactContent,
  StripeCardExactFooter,
};
