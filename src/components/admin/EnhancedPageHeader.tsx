import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

interface EnhancedPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: HeaderAction[];
  className?: string;
  children?: React.ReactNode;
}

export function EnhancedPageHeader({
  title,
  description,
  badge,
  actions = [],
  className,
  children
}: EnhancedPageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between",
      getSpacingClasses('content', 'lg'),
      "pb-6 border-b border-primary/10",
      className
    )}>
      {/* Title Section */}
      <div className={getSpacingClasses('content', 'sm')}>
        <div className="flex items-center space-x-3">
          <h1 className={cn(
            getTypographyClasses('heading', 'xl', 'text-foreground'),
            "tracking-tight"
          )}>
            {title}
          </h1>
          {badge && (
            <Badge 
              variant={badge.variant || 'default'} 
              className="shadow-soft"
            >
              {badge.label}
            </Badge>
          )}
        </div>
        
        {description && (
          <p className={cn(
            getTypographyClasses('body', 'lg', 'text-muted-foreground'),
            "max-w-3xl"
          )}>
            {description}
          </p>
        )}
        
        {children}
      </div>

      {/* Actions Section */}
      {actions.length > 0 && (
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {actions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={`action-${index}`}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn(
                  "shadow-soft transition-all duration-200",
                  action.variant === 'default' && "cta-primary hover:shadow-medium",
                  action.variant === 'outline' && "border-primary/20 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {action.loading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  Icon && <Icon className="mr-2 h-4 w-4" />
                )}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}