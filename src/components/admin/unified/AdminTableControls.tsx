import { ReactNode } from 'react';
import { Download, RefreshCw, Plus, Settings2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/design/typography';

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
            <h2 className={getTypographyClasses('heading', 'md', 'text-foreground')}>
              {title}
            </h2>
          )}
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
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
                className={cn(
                  'h-9 shadow-sm',
                  action.variant === 'outline' && 'hover:bg-slate-50'
                )}
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
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Badge variant="secondary" className="font-medium">
                    {selectedCount} selected
                  </Badge>
                  <span className={getTypographyClasses('body', 'sm', 'text-muted-foreground')}>
                    of {totalCount} items
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Bulk Action Dropdown */}
                {bulkActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="shadow-soft">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-medium bg-background/95 backdrop-blur-sm">
                      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                        Actions for {selectedCount} items
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {bulkActions.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          onClick={() => onBulkAction?.(action.key)}
                          className={cn(
                            'hover:bg-primary/5 cursor-pointer',
                            action.variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
                          )}
                        >
                          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Clear Selection */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearSelection}
                  className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Children */}
      {children}
    </div>
  );
}