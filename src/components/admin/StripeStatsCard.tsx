/**
 * Stripe-inspired Stats Cards
 * Clean, data-dense metrics display
 */

import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StripeCard, StripeCardContent } from "@/components/ui/stripe-card";

export interface StatsChange {
  value: string;
  isPositive: boolean;
  label?: string;
}

export interface StripeStatsCardProps {
  title: string;
  value: string | number;
  change?: StatsChange;
  icon: LucideIcon;
  className?: string;
}

export function StripeStatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  className 
}: StripeStatsCardProps) {
  return (
    <StripeCard hoverable className={className}>
      <StripeCardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>
            {change && (
              <div className={cn(
                "mt-2 flex items-center text-sm",
                change.isPositive ? "text-status-success" : "text-status-error"
              )}>
                {change.isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="font-medium">{change.value}%</span>
                <span className="ml-1 text-muted-foreground">
                  {change.label || "vs last month"}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </StripeCardContent>
    </StripeCard>
  );
}
