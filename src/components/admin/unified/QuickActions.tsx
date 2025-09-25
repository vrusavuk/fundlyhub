import React from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings, 
  Filter,
  Search,
  BarChart3,
  FileText,
  Users,
  Building,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface QuickAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  tooltip?: string;
  badge?: string | number;
  shortcut?: string;
  className?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
  showLabels?: boolean;
  showTooltips?: boolean;
}

export function QuickActions({
  actions,
  layout = 'horizontal',
  className,
  showLabels = true,
  showTooltips = true,
}: QuickActionsProps) {
  const renderAction = (action: QuickAction) => {
    const IconComponent = action.icon;
    
    const buttonContent = (
      <Button
        key={action.key}
        variant={action.variant || 'outline'}
        size={action.size || 'default'}
        onClick={action.onClick}
        disabled={action.disabled}
        className={cn(
          "relative gap-2",
          !showLabels && "w-10 h-10 p-0",
          action.className
        )}
      >
        <IconComponent className={cn(
          "h-4 w-4",
          !showLabels && "h-5 w-5"
        )} />
        {showLabels && action.label}
        
        {/* Keyboard shortcut */}
        {action.shortcut && showLabels && (
          <Badge variant="secondary" className="text-xs px-1 py-0 h-auto ml-auto">
            {action.shortcut}
          </Badge>
        )}

        {/* Badge indicator */}
        {action.badge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
          >
            {action.badge}
          </Badge>
        )}
      </Button>
    );

    if (showTooltips && (action.tooltip || !showLabels)) {
      return (
        <Tooltip key={action.key}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col items-center gap-1">
              <span>{action.tooltip || action.label}</span>
              {action.shortcut && (
                <Badge variant="outline" className="text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const layoutClasses = {
    horizontal: 'flex items-center gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2',
  };

  return (
    <TooltipProvider>
      <div className={cn(layoutClasses[layout], className)}>
        {actions.map(renderAction)}
      </div>
    </TooltipProvider>
  );
}

// Predefined quick actions for common admin tasks
export const CommonQuickActions = {
  users: {
    create: {
      key: 'create-user',
      label: 'Add User',
      icon: Plus,
      shortcut: 'Ctrl+N',
    },
    import: {
      key: 'import-users',
      label: 'Import',
      icon: Upload,
    },
    export: {
      key: 'export-users',
      label: 'Export',
      icon: Download,
    },
    refresh: {
      key: 'refresh-users',
      label: 'Refresh',
      icon: RefreshCw,
      shortcut: 'F5',
    },
  },
  campaigns: {
    create: {
      key: 'create-campaign',
      label: 'New Campaign',
      icon: Plus,
      shortcut: 'Ctrl+N',
    },
    analytics: {
      key: 'campaign-analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    export: {
      key: 'export-campaigns',
      label: 'Export',
      icon: Download,
    },
    refresh: {
      key: 'refresh-campaigns',
      label: 'Refresh',
      icon: RefreshCw,
      shortcut: 'F5',
    },
  },
  organizations: {
    create: {
      key: 'create-org',
      label: 'Add Organization',
      icon: Plus,
      shortcut: 'Ctrl+N',
    },
    import: {
      key: 'import-orgs',
      label: 'Import',
      icon: Upload,
    },
    export: {
      key: 'export-orgs',
      label: 'Export',
      icon: Download,
    },
    refresh: {
      key: 'refresh-orgs',
      label: 'Refresh',
      icon: RefreshCw,
      shortcut: 'F5',
    },
  },
  general: {
    settings: {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
    },
    reports: {
      key: 'reports',
      label: 'Reports',
      icon: FileText,
    },
    search: {
      key: 'global-search',
      label: 'Search',
      icon: Search,
      shortcut: 'Ctrl+K',
    },
  },
};