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
    <div className={cn('flex-1 flex flex-col', className)}>
      {/* Page Header - White background, tight to navigation header */}
      <div className="bg-white border-b border-[#E3E8EE] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-semibold text-[#0A2540]">
                {title}
              </h1>
              {badge && (
                <Badge
                  variant={badge.variant || 'default'}
                  className={cn(
                    'text-xs font-medium',
                    badge.variant === 'destructive' && 'bg-[#DF1B41] text-white',
                    badge.variant === 'secondary' && 'bg-[#E3E8EE] text-[#0A2540]',
                    badge.variant === 'outline' && 'border-[#E3E8EE] bg-white text-[#0A2540]',
                    (!badge.variant || badge.variant === 'default') && 'bg-[#635BFF] text-white'
                  )}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-[14px] text-[#425466] mt-1">
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

      {/* Content Section - Gray background, consistent padding */}
      <div className="flex-1 bg-[#F6F9FC] px-6 py-6">
        {children}
      </div>
    </div>
  );
}
