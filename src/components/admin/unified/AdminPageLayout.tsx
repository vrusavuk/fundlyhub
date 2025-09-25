import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getSpacingClasses, getTypographyClasses } from '@/lib/design/typography';

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
}

export function AdminPageLayout({
  title,
  description,
  badge,
  actions,
  stats,
  filters,
  children,
  className
}: AdminPageLayoutProps) {
  return (
    <div className={cn('section-hierarchy', className)}>
      {/* Page Header */}
      <header className={cn('mb-6', getSpacingClasses('section', 'md'))}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={getTypographyClasses('heading', 'lg', 'text-foreground')}>
                {title}
              </h1>
              {badge && (
                <span className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium',
                  badge.variant === 'destructive' && 'bg-destructive/10 text-destructive',
                  badge.variant === 'secondary' && 'bg-secondary text-secondary-foreground',
                  badge.variant === 'outline' && 'border border-border bg-background',
                  (!badge.variant || badge.variant === 'default') && 'bg-primary/10 text-primary'
                )}>
                  {badge.text}
                </span>
              )}
            </div>
            {description && (
              <p className={getTypographyClasses('body', 'md', 'text-muted-foreground')}>
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
          {filters}
        </section>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}