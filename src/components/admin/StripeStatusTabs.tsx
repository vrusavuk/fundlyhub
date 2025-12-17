/**
 * Stripe Status Filter Tabs
 * Replicates Stripe's status filter cards with counts
 */

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatusTab {
  key: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface StripeStatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function StripeStatusTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: StripeStatusTabsProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all",
              "hover:border-primary hover:bg-muted",
              isActive
                ? "border-primary bg-interactive-surface text-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
