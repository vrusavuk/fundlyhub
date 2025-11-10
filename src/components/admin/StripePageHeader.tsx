/**
 * Stripe-inspired Page Headers
 * Clean, minimal headers with consistent spacing
 * Note: Breadcrumbs are now handled by AdminLayout fixed header
 */

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
}

export interface StripePageHeaderProps {
  title: string;
  description?: string;
  actions?: HeaderAction[];
  breadcrumbs?: boolean;
  className?: string;
}

export function StripePageHeader({
  title,
  description,
  actions,
  breadcrumbs = true,
  className,
}: StripePageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 ml-4">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "shadow-sm h-9",
                  action.variant === 'default' && "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
