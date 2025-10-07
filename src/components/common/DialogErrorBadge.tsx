import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const dialogErrorBadgeVariants = cva(
  "relative w-full rounded-lg border p-3 mb-4 animate-in slide-in-from-top-2 fade-in duration-300",
  {
    variants: {
      variant: {
        error: "bg-destructive/10 border-destructive/50 text-destructive",
        warning: "bg-warning/10 border-warning/50 text-warning-foreground",
        info: "bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400",
        success: "bg-success/10 border-success/50 text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
);

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

export interface DialogErrorBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogErrorBadgeVariants> {
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
}

export function DialogErrorBadge({
  variant = "error",
  title,
  message,
  dismissible = false,
  onDismiss,
  action,
  className,
  ...props
}: DialogErrorBadgeProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const Icon = icons[variant || "error"];

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className={cn(dialogErrorBadgeVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 space-y-1">
          {title && (
            <div className="font-semibold text-sm leading-none">{title}</div>
          )}
          <div className="text-sm leading-relaxed opacity-90">{message}</div>
          
          {action && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={action.onClick}
                disabled={action.loading}
                className="h-7 text-xs"
              >
                {action.loading && (
                  <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {action.label}
              </Button>
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
