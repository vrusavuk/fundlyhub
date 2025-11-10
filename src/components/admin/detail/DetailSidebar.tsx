/**
 * Detail Sidebar Component
 * Wrapper for sidebar content with consistent styling
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface DetailSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function DetailSidebar({ children, className }: DetailSidebarProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

interface DetailSidebarSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSidebarSection({
  title,
  children,
  className,
}: DetailSidebarSectionProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-[14px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="px-6 py-4 space-y-3">
        {children}
      </div>
    </div>
  );
}
