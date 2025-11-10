import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { AdminPageLayoutProps } from '@/types/admin-layout';

/**
 * AdminPageLayout - Stripe-Inspired Page Layout
 * 
 * A semantic, reusable layout component for admin pages with seamless content flow.
 * - No separate header section or borders
 * - Title is the first content element with natural flow
 * - Consistent spacing and visual hierarchy
 * - Single scrollable container
 * 
 * Usage:
 * <AdminPageLayout
 *   title="Page Title"
 *   description="Optional description"
 *   badge={{ text: "Beta", variant: "default" }}
 *   actions={<Button>Action</Button>}
 * >
 *   <ChildComponent />
 *   <AnotherComponent />
 * </AdminPageLayout>
 */
export function AdminPageLayout({
  title,
  description,
  badge,
  actions,
  children,
  className
}: AdminPageLayoutProps) {
  return (
    <div className={cn('bg-background w-full max-w-full overflow-x-hidden', className)}>
      {/* Content container with responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Page Header - responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || 'default'} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground max-w-3xl">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {actions}
            </div>
          )}
        </div>

        {/* Content - with overflow protection */}
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
