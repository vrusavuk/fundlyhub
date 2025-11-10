/**
 * EXACT Stripe Dashboard Metric Card
 * Replicates Stripe's metric cards - no icon backgrounds
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
        "bg-white border border-[#E3E8EE] rounded-lg p-5",
        className
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[#425466] mb-2">
        {label}
      </p>
      <p className="text-[32px] font-semibold text-[#0A2540] leading-none mb-2">
        {value}
      </p>
      {change && (
        <div
          className={cn(
            "flex items-center text-[14px] font-medium",
            change.isPositive ? "text-[#00D924]" : "text-[#DF1B41]"
          )}
        >
          {change.isPositive ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          <span>{change.value}%</span>
          {change.label && (
            <span className="ml-1 text-[#425466] font-normal">
              {change.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
