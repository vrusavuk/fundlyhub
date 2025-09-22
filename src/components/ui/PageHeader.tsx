/**
 * Page header component for consistent page layouts
 * Provides standardized headers with titles, descriptions, and actions
 */
import { ReactNode } from 'react';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';

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
  return (
    <div className={`mb-6 ${className || ''}`}>
      {/* Smart Navigation */}
      <SmartBackButton />
      {showBreadcrumbs && <SmartBreadcrumb className="mb-4" />}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}