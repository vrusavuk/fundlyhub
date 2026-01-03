/**
 * Stripe-inspired Detail Page Layout
 * Provides consistent structure for entity detail pages
 * Responsive: stacks on mobile, 2-column on desktop
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DetailPageLayoutProps {
  // Header section
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  
  // Sticky action bar for edit mode
  stickyActions?: React.ReactNode;
  
  // Layout
  mainContent: React.ReactNode;
  sidebar: React.ReactNode;
  
  // Navigation
  backUrl?: string;
  backLabel?: string;
  
  className?: string;
}

export function DetailPageLayout({
  title,
  subtitle,
  status,
  actions,
  stickyActions,
  mainContent,
  sidebar,
  backUrl,
  backLabel = 'Back',
  className,
}: DetailPageLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBack = () => {
    // Always use browser history first for proper back navigation
    // Only fall back to backUrl when there's no history (e.g., direct link access)
    if (window.history.length > 1) {
      navigate(-1);
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className={cn("bg-background w-full", className)}>
      {/* Header Section */}
      <div className="border-b border-border bg-card px-4 md:px-8 py-4 md:py-6">
        {/* Back button for mobile */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {backLabel}
          </Button>
        )}
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              {typeof title === 'string' ? (
                <h1 className="text-xl md:text-[32px] font-semibold text-foreground leading-tight">
                  {title}
                </h1>
              ) : (
                <div className="flex-1 min-w-0 text-xl md:text-[32px] font-semibold text-foreground leading-tight">
                  {title}
                </div>
              )}
              {status && <div className="shrink-0">{status}</div>}
            </div>
            {subtitle && (
              <div className="text-xs md:text-[14px] text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div className="shrink-0 flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Stacked on mobile, 2-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
        {/* Main Content - Full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 order-1">
          {mainContent}
        </div>

        {/* Sidebar - Full width on mobile (below main), 1/3 on desktop */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6 order-2">
          {sidebar}
        </div>
      </div>

      {/* Sticky Action Bar for Edit Mode */}
      {stickyActions && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 md:px-8 shadow-lg">
          <div className="flex items-center gap-2 max-w-7xl mx-auto md:justify-end [&>*]:flex-1 md:[&>*]:flex-none">
            {stickyActions}
          </div>
        </div>
      )}
    </div>
  );
}
