import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface AdminContentContainerProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  loadingText?: string;
  retry?: () => void;
}

export function AdminContentContainer({
  children,
  loading = false,
  error = null,
  empty = false,
  emptyTitle = "No data found",
  emptyDescription = "There are no items to display.",
  emptyAction,
  className,
  loadingText = "Loading...",
  retry
}: AdminContentContainerProps) {
  // Error State
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Alert variant="destructive" className="shadow-soft border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {retry && (
              <Button
                variant="outline"
                size="sm"
                onClick={retry}
                className="ml-4 h-8 px-3"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12',
        getSpacingClasses('content', 'lg'),
        className
      )}>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className={getTypographyClasses('body', 'md', 'text-muted-foreground')}>
            {loadingText}
          </p>
        </div>
      </div>
    );
  }

  // Empty State
  if (empty) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-16',
        getSpacingClasses('content', 'lg'),
        className
      )}>
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
            <Wifi className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className={getTypographyClasses('heading', 'md', 'text-foreground')}>
              {emptyTitle}
            </h3>
            <p className={getTypographyClasses('body', 'md', 'text-muted-foreground')}>
              {emptyDescription}
            </p>
          </div>
          
          {emptyAction && (
            <Button
              onClick={emptyAction.onClick}
              variant="outline"
              className="shadow-soft border-primary/10 hover:bg-primary/5"
            >
              {emptyAction.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Normal Content
  return (
    <div className={className}>
      {children}
    </div>
  );
}