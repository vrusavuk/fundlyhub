import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StripeCardExact } from '@/components/ui/stripe-card-exact';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: ReactNode;
  stats?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  breadcrumbs?: boolean;
}

export function AdminPageLayout({
  title,
  description,
  badge,
  actions,
  stats,
  filters,
  children,
  className,
  breadcrumbs = true
}: AdminPageLayoutProps) {
  return (
    <div className={cn('px-6 py-4 bg-[#F6F9FC] min-h-screen', className)}>
      {/* Breadcrumbs - Stripe puts these above header */}
      {breadcrumbs && (
        <div className="mb-2">
          <SmartBreadcrumb />
        </div>
      )}

      {/* Page Header - EXACT Stripe Style */}
      <header className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[24px] font-semibold text-[#0A2540]">
                {title}
              </h1>
              {badge && (
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                  badge.variant === 'destructive' && 'bg-[#DF1B41] text-white',
                  badge.variant === 'secondary' && 'bg-[#E3E8EE] text-[#0A2540]',
                  badge.variant === 'outline' && 'border border-[#E3E8EE] bg-white text-[#0A2540]',
                  (!badge.variant || badge.variant === 'default') && 'bg-[#635BFF] text-white'
                )}>
                  {badge.text}
                </span>
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
      </header>

      {/* Stats Section */}
      {stats && (
        <section className="mb-6">
          {stats}
        </section>
      )}

      {/* Filters Section */}
      {filters && (
        <section className="mb-6">
          <StripeCardExact>
            {filters}
          </StripeCardExact>
        </section>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}