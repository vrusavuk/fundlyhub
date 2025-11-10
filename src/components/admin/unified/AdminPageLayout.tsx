import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StripeCard } from '@/components/ui/stripe-card';
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
    <div className={cn('px-6 py-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-3">
          <SmartBreadcrumb />
        </div>
      )}

      {/* Page Header - Stripe Style */}
      <header className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {title}
              </h1>
              {badge && (
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
                  badge.variant === 'destructive' && 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
                  badge.variant === 'secondary' && 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
                  badge.variant === 'outline' && 'border border-slate-200 bg-white text-slate-700',
                  (!badge.variant || badge.variant === 'default') && 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20'
                )}>
                  {badge.text}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-slate-600 mt-1">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2 ml-4">
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
          <StripeCard>
            <div className="px-6 py-4">
              {filters}
            </div>
          </StripeCard>
        </section>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}