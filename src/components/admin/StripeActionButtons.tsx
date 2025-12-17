/**
 * Stripe Action Buttons
 * Top-right action button group with primary purple button
 */

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionButton {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface StripeActionButtonsProps {
  actions: ActionButton[];
  primaryAction?: ActionButton;
  className?: string;
}

export function StripeActionButtons({
  actions,
  primaryAction,
  className,
}: StripeActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={cn(
              "h-9 px-4 text-sm font-medium",
              action.variant === "outline" &&
                "border-border hover:border-primary hover:bg-muted"
            )}
          >
            {action.loading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              Icon && <Icon className="h-4 w-4 mr-2" />
            )}
            {action.label}
            {action.shortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground bg-muted border border-border rounded">
                {action.shortcut}
              </kbd>
            )}
          </Button>
        );
      })}

      {primaryAction && (
        <Button
          variant="default"
          size="sm"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          className="h-9 px-4 text-sm font-medium"
        >
          {primaryAction.loading ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />
          )}
          {primaryAction.label}
          {primaryAction.shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold bg-primary-foreground/20 border border-primary-foreground/30 rounded">
              {primaryAction.shortcut}
            </kbd>
          )}
        </Button>
      )}
    </div>
  );
}
