/**
 * Stripe-inspired Card Components
 * Clean, minimal cards with subtle borders and no heavy shadows
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StripeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export interface StripeCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface StripeCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface StripeCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const StripeCard = React.forwardRef<HTMLDivElement, StripeCardProps>(
  ({ children, className, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card border border-border rounded-lg",
          "transition-all duration-200",
          hoverable && "hover:shadow-sm hover:border-border/80",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StripeCard.displayName = "StripeCard";

const StripeCardHeader = React.forwardRef<HTMLDivElement, StripeCardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4 border-b border-border",
          "flex items-center justify-between",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StripeCardHeader.displayName = "StripeCardHeader";

const StripeCardContent = React.forwardRef<HTMLDivElement, StripeCardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-6 py-5", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StripeCardContent.displayName = "StripeCardContent";

const StripeCardFooter = React.forwardRef<HTMLDivElement, StripeCardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4 border-t border-border",
          "flex items-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StripeCardFooter.displayName = "StripeCardFooter";

export { StripeCard, StripeCardHeader, StripeCardContent, StripeCardFooter };
