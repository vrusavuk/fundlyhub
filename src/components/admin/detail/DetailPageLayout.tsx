/**
 * Stripe-inspired Detail Page Layout
 * Provides consistent structure for entity detail pages
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface DetailPageLayoutProps {
  // Header section
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  
  // Layout
  mainContent: React.ReactNode;
  sidebar: React.ReactNode;
  
  className?: string;
}

export function DetailPageLayout({
  title,
  subtitle,
  status,
  actions,
  mainContent,
  sidebar,
  className,
}: DetailPageLayoutProps) {
  return (
    <div className={cn("bg-background w-full", className)}>
      {/* Header Section */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[32px] font-semibold text-foreground leading-tight">
                {title}
              </h1>
              {status && <div className="shrink-0">{status}</div>}
            </div>
            {subtitle && (
              <div className="text-[14px] text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div className="shrink-0 flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {mainContent}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1 space-y-6">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
