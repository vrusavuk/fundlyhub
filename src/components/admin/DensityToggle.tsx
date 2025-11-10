/**
 * Table Density Toggle
 * Allows users to control data density like Stripe
 */

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Density = 'compact' | 'comfortable';

export interface DensityToggleProps {
  value: Density;
  onChange: (value: Density) => void;
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 shadow-sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Density
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-background/95 backdrop-blur-sm">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
          Display density
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Density)}>
          <DropdownMenuRadioItem value="compact">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Compact</span>
              <span className="text-xs text-muted-foreground">More rows per page</span>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Comfortable</span>
              <span className="text-xs text-muted-foreground">Balanced view</span>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
