/**
 * Page header component for consistent page layouts
 * Provides standardized headers with titles, descriptions, and actions
 */
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  showBackButton = false,
  backTo = '/',
  className
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${className || ''}`}>
      <div className="flex-1">
        {showBackButton && (
          <Button variant="ghost" size="sm" asChild className="mb-3">
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        )}
        
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
  );
}