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
              "hover:border-[#635BFF] hover:bg-[#F6F9FC]",
              isActive
                ? "border-[#635BFF] bg-[#FAFAFF] text-[#0A2540]"
                : "border-[#E3E8EE] bg-white text-[#425466]"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-semibold",
                  isActive
                    ? "bg-[#635BFF] text-white"
                    : "bg-[#E3E8EE] text-[#425466]"
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
