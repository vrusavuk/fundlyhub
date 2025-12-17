/**
 * Info Banner Component
 * Uses semantic design tokens for consistent styling
 */

import { ReactNode, useState } from "react";
import { X, Lightbulb, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StripeInfoBannerProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "info" | "recommendation" | "warning";
  dismissible?: boolean;
  className?: string;
}

export function StripeInfoBanner({
  message,
  actionLabel,
  onAction,
  variant = "recommendation",
  dismissible = true,
  className,
}: StripeInfoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const icons = {
    info: Info,
    recommendation: Lightbulb,
    warning: AlertCircle,
  };

  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-lg border",
        variant === "info" && "bg-banner-info-bg border-banner-info-border text-banner-info-text",
        variant === "recommendation" && "bg-banner-recommendation-bg border-banner-recommendation-border text-banner-recommendation-text",
        variant === "warning" && "bg-banner-warning-bg border-banner-warning-border text-banner-warning-text",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {actionLabel && onAction && (
          <Button
            variant="link"
            size="sm"
            onClick={onAction}
            className="text-primary hover:text-primary-hover h-auto p-0 font-medium text-sm"
          >
            {actionLabel} →
          </Button>
        )}

        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-foreground/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
