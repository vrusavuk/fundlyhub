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
}

export function DetailSection({
  title,
  children,
  actions,
  className,
}: DetailSectionProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
}
