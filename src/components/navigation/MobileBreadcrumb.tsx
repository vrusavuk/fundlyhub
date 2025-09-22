/**
 * Mobile-optimized breadcrumb component
 * Shows compact navigation with horizontal scroll for long paths
 */
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigation, BreadcrumbItem } from '@/contexts/NavigationContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface MobileBreadcrumbProps {
  className?: string;
  maxItems?: number;
}

interface EllipsisItem {
  label: string;
  href: string;
  isEllipsis: boolean;
}

type DisplayBreadcrumbItem = BreadcrumbItem | EllipsisItem;

export function MobileBreadcrumb({ className, maxItems = 3 }: MobileBreadcrumbProps) {
  const { breadcrumbs } = useNavigation();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Show only parent + current for mobile
  const displayBreadcrumbs: DisplayBreadcrumbItem[] = breadcrumbs.length > maxItems 
    ? [
        breadcrumbs[0], // Home
        { label: '...', href: '', isEllipsis: true }, // Ellipsis
        ...breadcrumbs.slice(-2) // Last 2 items
      ]
    : breadcrumbs;

  const isEllipsisItem = (item: DisplayBreadcrumbItem): item is EllipsisItem => {
    return 'isEllipsis' in item && item.isEllipsis === true;
  };

  return (
    <div className={`mb-3 ${className || ''}`}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center space-x-1 text-sm">
          {displayBreadcrumbs.map((item, index) => (
            <div key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
              )}
              
              {isEllipsisItem(item) ? (
                <span className="text-muted-foreground px-2">…</span>
              ) : index === displayBreadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {item.label}
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-auto p-1 text-muted-foreground hover:text-foreground min-h-[28px]"
                >
                  <Link to={item.href} className="truncate max-w-[100px]">
                    {item.label}
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}