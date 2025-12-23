/**
 * Detail Section Component
 * Consistent section wrapper for detail pages
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  /** Removes the outer card border/background so the section can blend into the page (useful for tables) */
  borderless?: boolean;
}

export function DetailSection({
  title,
  children,
  actions,
  className,
  noPadding,
  borderless,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        borderless ? 'bg-transparent' : 'bg-card border border-border rounded-lg',
        className
      )}
    >
      <header
        className={cn(
          'flex items-center justify-between',
          borderless ? 'px-0 py-0 mb-3' : 'px-6 py-4 border-b border-border'
        )}
      >
        <h2 className="text-[14px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {noPadding ? children : <div className={borderless ? 'px-0 py-0' : 'px-6 py-5'}>{children}</div>}
    </section>
  );
}
