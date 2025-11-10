/**
 * Stripe Filter Pills
 * Small rounded filter buttons like "Date and time", "Amount", etc.
 */

import { ReactNode, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface FilterPill {
  key: string;
  label: string;
  icon?: ReactNode;
  content?: ReactNode;
  isActive?: boolean;
  activeCount?: number;
  onClear?: () => void;
}

interface StripeFilterPillsProps {
  pills: FilterPill[];
  className?: string;
}

export function StripeFilterPills({ pills, className }: StripeFilterPillsProps) {
  const [openPill, setOpenPill] = useState<string | null>(null);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {pills.map((pill) => {
        const hasActiveCount = pill.activeCount && pill.activeCount > 0;

        return (
          <Popover
            key={pill.key}
            open={openPill === pill.key}
            onOpenChange={(open) => setOpenPill(open ? pill.key : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 px-3 text-[13px] font-normal border-[#E3E8EE] hover:border-[#635BFF] hover:bg-[#F6F9FC]",
                  pill.isActive && "border-[#635BFF] bg-[#FAFAFF]"
                )}
              >
                {pill.icon && <span className="mr-1.5">{pill.icon}</span>}
                <span>{pill.label}</span>
                {hasActiveCount && (
                  <span className="ml-1.5 px-1 py-0.5 rounded-sm bg-[#635BFF] text-white text-[11px] font-semibold">
                    {pill.activeCount}
                  </span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 text-[#425466]" />
              </Button>
            </PopoverTrigger>
            {pill.content && (
              <PopoverContent
                className="w-auto p-0 border-[#E3E8EE] shadow-lg"
                align="start"
              >
                <div className="p-4 min-w-[250px]">{pill.content}</div>
              </PopoverContent>
            )}
          </Popover>
        );
      })}
    </div>
  );
}
