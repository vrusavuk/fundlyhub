/**
 * Metric Card Component
 * Uses semantic design tokens for consistent styling
 */

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricChange {
  value: string;
  isPositive: boolean;
  label?: string;
}

export interface StripeMetricCardProps {
  label: string;
  value: string | number;
  change?: MetricChange;
  className?: string;
}

export function StripeMetricCard({
  label,
  value,
  change,
  className,
}: StripeMetricCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-3xl font-semibold text-foreground leading-none mb-2">
        {value}
      </p>
      {change && (
        <div
          className={cn(
            "flex items-center text-sm font-medium",
            change.isPositive ? "text-status-success" : "text-status-error"
          )}
        >
          {change.isPositive ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          <span>{change.value}%</span>
          {change.label && (
            <span className="ml-1 text-muted-foreground font-normal">
              {change.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
