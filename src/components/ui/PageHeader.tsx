/**
 * Page header component for consistent page layouts
 * Provides standardized headers with titles, descriptions, and actions
 * Now with mobile-optimized navigation context
 */
import { ReactNode } from 'react';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  showBreadcrumbs = true
}: PageHeaderProps) {
  const { navigationContext, isMobile, shouldShowBackButton } = useSmartNavigation();
  
  return (
    <div className={`mb-4 sm:mb-6 ${className || ''}`}>
      {/* Smart Navigation */}
      <SmartBackButton />
      {showBreadcrumbs && <SmartBreadcrumb className="mb-3 sm:mb-4" />}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          {/* Mobile context indicator when breadcrumbs are hidden */}
          {isMobile && shouldShowBackButton && navigationContext && (
            <p className="text-xs text-muted-foreground mb-1">
              {navigationContext}
            </p>
          )}
          
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}