import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { AdminPageLayoutProps } from '@/types/admin-layout';

/**
 * AdminPageLayout - Stripe-Inspired Page Layout
 * 
 * A semantic, reusable layout component for admin pages that follows
 * Stripe's design principles:
 * - White header section with title, description, badge, and actions
 * - Gray content area for page content
 * - Consistent spacing and visual hierarchy
 * 
 * Usage:
 * <AdminPageLayout
 *   title="Page Title"
 *   description="Optional description"
 *   badge={{ text: "Beta", variant: "default" }}
 *   actions={<Button>Action</Button>}
 * >
 *   <ChildComponent className="mb-6" />
 *   <AnotherComponent className="mb-6" />
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
    <div className={cn('flex-1 overflow-auto bg-white', className)}>
      {/* Single content container - everything flows together */}
      <div className="p-8 space-y-6">
        {/* Page Header - inline with content, no borders */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
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
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Content - flows naturally after title */}
        {children}
      </div>
    </div>
  );
}
