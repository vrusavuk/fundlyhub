/**
 * FundliesDropdown Component
 * Dropdown menu for navigating between Causes and Projects
 */

import { Link } from 'react-router-dom';
import { ChevronDown, Heart, Briefcase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FundliesDropdownProps {
  vertical?: boolean;
  onNavigate?: () => void;
}

export function FundliesDropdown({ vertical = false, onNavigate }: FundliesDropdownProps) {
  if (vertical) {
    // Mobile/Vertical: Show as expandable section
    return (
      <div className="space-y-1">
        <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
          Browse Fundlies
        </div>
        <Link
          to="/causes"
          className="flex items-center gap-3 py-3 px-4 rounded-md hover:bg-accent/50 min-h-[44px] text-foreground hover:text-primary transition-smooth"
          onClick={onNavigate}
        >
          <Heart className="h-4 w-4" />
          <div>
            <div className="font-medium">Causes</div>
            <div className="text-xs text-muted-foreground">
              Personal & charity campaigns
            </div>
          </div>
        </Link>
        <Link
          to="/projects"
          className="flex items-center gap-3 py-3 px-4 rounded-md hover:bg-accent/50 min-h-[44px] text-foreground hover:text-primary transition-smooth"
          onClick={onNavigate}
        >
          <Briefcase className="h-4 w-4" />
          <div>
            <div className="font-medium">Projects</div>
            <div className="text-xs text-muted-foreground">
              Structured milestone-based
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Desktop: Show as dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-foreground hover:text-primary transition-smooth h-auto px-3 py-2 font-normal"
        >
          Fundlies
          <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-background z-50">
        <DropdownMenuItem asChild>
          <Link 
            to="/causes" 
            className="flex items-start gap-3 cursor-pointer p-3 focus:bg-accent"
            onClick={onNavigate}
          >
            <Heart className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold text-sm">Causes</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Personal fundraisers and charity campaigns
              </div>
            </div>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link 
            to="/projects" 
            className="flex items-start gap-3 cursor-pointer p-3 focus:bg-accent"
            onClick={onNavigate}
          >
            <Briefcase className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold text-sm">Projects</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Milestone-based structured projects
              </div>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
