/**
 * Smart breadcrumb component that automatically generates breadcrumbs
 */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigation } from '@/contexts/NavigationContext';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

interface SmartBreadcrumbProps {
  className?: string;
  maxItems?: number;
}

export function SmartBreadcrumb({ className, maxItems = 5 }: SmartBreadcrumbProps) {
  const { breadcrumbs } = useNavigation();
  const { shouldShowBreadcrumbs } = useSmartNavigation();
  
  // Initialize breadcrumbs
  useBreadcrumbs();

  if (!shouldShowBreadcrumbs || breadcrumbs.length <= 1) {
    return null;
  }

  // Condense breadcrumbs if too many
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        ...breadcrumbs.slice(0, 1), // Keep home
        { label: '...', href: '', isEllipsis: true, isLoading: false },
        ...breadcrumbs.slice(-2) // Keep last 2
      ]
    : breadcrumbs;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {displayBreadcrumbs.map((item, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis;
          const isLoading = 'isLoading' in item ? item.isLoading : false;

          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {isEllipsis ? (
                  <BreadcrumbEllipsis />
                ) : isLast ? (
                  <BreadcrumbPage>
                    {isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      item.label
                    )}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>
                      {isLoading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        item.label
                      )}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}