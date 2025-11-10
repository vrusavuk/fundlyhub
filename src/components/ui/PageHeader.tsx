/**
 * Page header component for consistent page layouts
 * Provides standardized headers with titles, descriptions, and actions
 */
import { ReactNode } from 'react';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
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
  return (
    <div className={`mb-4 sm:mb-6 ${className || ''}`}>
      {/* Navigation */}
      {showBackButton && <SmartBackButton />}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
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