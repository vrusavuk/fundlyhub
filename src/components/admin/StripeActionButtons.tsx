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
              "h-9 px-4 text-[14px] font-medium",
              action.variant === "outline" &&
                "border-[#E3E8EE] hover:border-[#635BFF] hover:bg-[#F6F9FC]"
            )}
          >
            {action.loading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              Icon && <Icon className="h-4 w-4 mr-2" />
            )}
            {action.label}
            {action.shortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold text-[#425466] bg-[#F6F9FC] border border-[#E3E8EE] rounded">
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
          className="h-9 px-4 text-[14px] font-medium bg-[#635BFF] hover:bg-[#5048E5] text-white"
        >
          {primaryAction.loading ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />
          )}
          {primaryAction.label}
          {primaryAction.shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold bg-[#7C75FF] border border-[#8B85FF] rounded">
              {primaryAction.shortcut}
            </kbd>
          )}
        </Button>
      )}
    </div>
  );
}
