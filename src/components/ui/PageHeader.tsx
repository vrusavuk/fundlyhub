/**
 * Page header component for consistent page layouts
 * Provides standardized headers with titles, descriptions, and actions
 * Now with mobile-optimized navigation context
 */
import { ReactNode } from 'react';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import { DisplayHeading, Text } from '@/components/ui/typography';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
  showBackButton?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  showBreadcrumbs = true,
  showBackButton = true
}: PageHeaderProps) {
  const { navigationContext, isMobile, shouldShowBackButton } = useSmartNavigation();
  
  return (
    <div className={`mb-4 sm:mb-6 ${className || ''}`}>
      {/* Smart Navigation */}
      {showBackButton && <SmartBackButton />}
      {showBreadcrumbs && <SmartBreadcrumb className="mb-3 sm:mb-4" />}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          {/* Mobile context indicator when breadcrumbs are hidden */}
          {isMobile && shouldShowBackButton && navigationContext && (
            <p className="text-xs text-muted-foreground mb-1">
              {navigationContext}
            </p>
          )}
          
          <DisplayHeading level="sm" as="h1" responsive className="leading-tight">
            {title}
          </DisplayHeading>
          {description && (
            <Text size="sm" emphasis="low" className="mt-1 sm:mt-2">
              {description}
            </Text>
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