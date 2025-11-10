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
    <div className={cn('flex-1 flex flex-col min-h-0 bg-white', className)}>
      {/* Page Header - White background with bottom border */}
      <div className="shrink-0 bg-white border-b border-border px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {title}
              </h1>
              {badge && (
                <Badge
                  variant={badge.variant || 'default'}
                  className="text-xs"
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Clean white background with padding */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="p-8 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
