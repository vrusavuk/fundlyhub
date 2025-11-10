/**
 * Stripe Info Banner
 * Light gray-blue recommendation banners with icons
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
        variant === "info" && "bg-[#F0F4FF] border-[#D0DBFF] text-[#0A2540]",
        variant === "recommendation" && "bg-[#F6F9FC] border-[#E3E8EE] text-[#425466]",
        variant === "warning" && "bg-[#FFF6E5] border-[#FFE4B3] text-[#6B4600]",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-[14px]">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {actionLabel && onAction && (
          <Button
            variant="link"
            size="sm"
            onClick={onAction}
            className="text-[#635BFF] hover:text-[#5048E5] h-auto p-0 font-medium text-[14px]"
          >
            {actionLabel} →
          </Button>
        )}

        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-[#0A2540]/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
