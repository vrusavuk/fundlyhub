import { ReactNode } from 'react';
import { Download, RefreshCw, Plus, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeBadgeExact } from '@/components/ui/stripe-badge-exact';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation?: boolean;
}

export interface TableAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  customRender?: () => ReactNode;
}

interface AdminTableControlsProps {
  title?: string;
  selectedCount?: number;
  totalCount?: number;
  actions?: TableAction[];
  bulkActions?: BulkAction[];
  onBulkAction?: (actionKey: string) => void;
  onClearSelection?: () => void;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AdminTableControls({
  title,
  selectedCount = 0,
  totalCount = 0,
  actions = [],
  bulkActions = [],
  onBulkAction,
  onClearSelection,
  loading = false,
  className,
  children
}: AdminTableControlsProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {title && (
            <h2 className="text-[16px] font-semibold text-[#0A2540]">
              {title}
            </h2>
          )}
          {totalCount > 0 && (
            <StripeBadgeExact variant="neutral">
              {totalCount.toLocaleString()} total
            </StripeBadgeExact>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            action.customRender ? (
              <div key={action.key}>{action.customRender()}</div>
            ) : (
              <Button
                key={action.key}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || loading}
                className="h-9"
              >
                {action.loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : action.icon ? (
                  <action.icon className="h-4 w-4 mr-2" />
                ) : null}
                {action.label}
              </Button>
            )
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && bulkActions.length > 0 && (
        <div className="bg-[#F6F9FC] border border-[#E3E8EE] rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StripeBadgeExact variant="info">
                {selectedCount} selected
              </StripeBadgeExact>
              
              {/* Bulk Action Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-9">
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#E3E8EE]">
                  <DropdownMenuLabel className="text-[12px] font-medium text-[#425466]">
                    Actions for {selectedCount} items
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {bulkActions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={() => onBulkAction?.(action.key)}
                      className={cn(
                        'text-[14px] cursor-pointer',
                        action.variant === 'destructive' && 'text-[#DF1B41]'
                      )}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="h-8 text-[#425466] hover:text-[#0A2540] hover:bg-white"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Custom Children */}
      {children}
    </div>
  );
}