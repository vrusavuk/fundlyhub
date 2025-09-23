/**
 * Accessibility-enhanced button component
 * Provides comprehensive keyboard navigation and screen reader support
 */
import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  describedBy?: string;
  expanded?: boolean;
  controls?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    loading = false,
    loadingText = "Loading",
    describedBy,
    expanded,
    controls,
    haspopup,
    children,
    disabled,
    className,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={describedBy}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-haspopup={haspopup}
        aria-live={loading ? 'polite' : undefined}
        aria-busy={loading}
        className={cn(
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {loading ? loadingText : children}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";