import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  Grid,
  List,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Mobile-optimized search bar
interface MobileSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterCount?: number;
  className?: string;
}

export function MobileSearch({
  value,
  onChange,
  placeholder = "Search...",
  onFilterPress,
  filterCount = 0,
  className,
}: MobileSearchProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-4"
        />
      </div>
      
      {onFilterPress && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterPress}
          className="gap-2 px-3"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-xs">
              {filterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

// Mobile-optimized filter panel
interface MobileFiltersProps {
  title?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearAll?: () => void;
  className?: string;
}

export function MobileFilters({
  title = "Filters",
  children,
  isOpen,
  onOpenChange,
  onClearAll,
  className,
}: MobileFiltersProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("max-h-[80vh]", className)}>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-sm text-muted-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pb-6">
            {children}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Mobile-optimized stats cards
interface MobileStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}

export function MobileStats({ stats, className }: MobileStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleStats = isExpanded ? stats : stats.slice(0, 2);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        {visibleStats.map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <div
              key={index}
              className="p-3 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground truncate">
                  {stat.label}
                </span>
                {IconComponent && (
                  <IconComponent className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              
              <div className="text-lg font-semibold">{stat.value}</div>
              
              {stat.change && (
                <div className={cn(
                  "text-xs flex items-center gap-1",
                  stat.trend === 'up' && "text-green-600",
                  stat.trend === 'down' && "text-red-600",
                  stat.trend === 'neutral' && "text-muted-foreground"
                )}>
                  {stat.trend === 'up' && <ChevronUp className="h-3 w-3" />}
                  {stat.trend === 'down' && <ChevronDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stats.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center gap-2 text-xs"
        >
          {isExpanded ? (
            <>
              Show Less
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show More ({stats.length - 2} more)
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Mobile-optimized action bar
interface MobileActionBarProps {
  actions: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    disabled?: boolean;
  }>;
  className?: string;
}

export function MobileActionBar({ actions, className }: MobileActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const primaryActions = actions.slice(0, 2);
  const secondaryActions = actions.slice(2);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Primary actions - always visible */}
      <div className="flex gap-2">
        {primaryActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <Button
              key={action.key}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex-1 gap-2"
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
        
        {/* More actions button */}
        {secondaryActions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Secondary actions - collapsible */}
      {secondaryActions.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2">
              {secondaryActions.map((action) => {
                const IconComponent = action.icon;
                
                return (
                  <Button
                    key={action.key}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="gap-2 justify-start"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Mobile-optimized view switcher
interface MobileViewSwitcherProps {
  currentView: 'table' | 'cards' | 'list';
  onViewChange: (view: 'table' | 'cards' | 'list') => void;
  className?: string;
}

export function MobileViewSwitcher({
  currentView,
  onViewChange,
  className,
}: MobileViewSwitcherProps) {
  const views = [
    { key: 'cards' as const, label: 'Cards', icon: Grid },
    { key: 'list' as const, label: 'List', icon: List },
    { key: 'table' as const, label: 'Table', icon: Settings },
  ];

  return (
    <div className={cn("flex rounded-lg border bg-muted p-1", className)}>
      {views.map((view) => {
        const IconComponent = view.icon;
        const isActive = currentView === view.key;
        
        return (
          <Button
            key={view.key}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(view.key)}
            className={cn(
              "flex-1 gap-2 text-xs",
              isActive && "bg-background shadow-sm"
            )}
          >
            <IconComponent className="h-3 w-3" />
            {view.label}
          </Button>
        );
      })}
    </div>
  );
}

// Mobile-optimized sticky header
interface MobileStickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileStickyHeader({ children, className }: MobileStickyHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isSticky && "shadow-sm border-b",
        className
      )}
    >
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}