import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export interface DialogStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  loading?: boolean;
  progress?: number; // 0-100 for progress bar
}

export function DialogStatusIndicator({
  status,
  loading = false,
  progress,
  className,
  ...props
}: DialogStatusIndicatorProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg bg-muted/50 border border-border/50 p-3 mb-4 animate-in fade-in duration-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">{status}</div>
          {typeof progress === "number" && (
            <Progress value={progress} className="mt-2 h-1" />
          )}
        </div>
      </div>
    </div>
  );
}
