/**
 * Simple breadcrumb component for admin panel
 * Display-only component with no logic or state
 */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm overflow-hidden" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <Fragment key={`${item.href}-${index}`}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {index === items.length - 1 ? (
            <span className="font-medium text-foreground px-2 truncate max-w-[200px] sm:max-w-none" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 truncate max-w-[150px] sm:max-w-none"
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
