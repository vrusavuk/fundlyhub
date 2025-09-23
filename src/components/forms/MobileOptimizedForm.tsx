/**
 * Mobile-optimized form container with enhanced UX
 * Provides better keyboard handling, validation, and accessibility
 */
import React, { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { hapticFeedback, breakpointUtils } from '@/lib/utils/mobile';

interface MobileOptimizedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  enableHaptic?: boolean;
  preventKeyboardJump?: boolean;
  containerClassName?: string;
}

export function MobileOptimizedForm({
  children,
  onSubmit,
  loading = false,
  enableHaptic = true,
  preventKeyboardJump = true,
  containerClassName,
  className,
  ...props
}: MobileOptimizedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = breakpointUtils.isMobile();

  // Prevent viewport jumping when virtual keyboard appears
  useEffect(() => {
    if (!preventKeyboardJump || !isMobile) return;

    const handleFocusIn = () => {
      // Add a small delay to ensure keyboard is showing
      setTimeout(() => {
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
      }, 150);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        document.body.style.height = '';
        document.body.style.overflow = '';
      }, 150);
    };

    const form = formRef.current;
    if (form) {
      form.addEventListener('focusin', handleFocusIn);
      form.addEventListener('focusout', handleFocusOut);

      return () => {
        form.removeEventListener('focusin', handleFocusIn);
        form.removeEventListener('focusout', handleFocusOut);
        // Cleanup styles
        document.body.style.height = '';
        document.body.style.overflow = '';
      };
    }
  }, [preventKeyboardJump, isMobile]);

  // Enhanced form submission with haptic feedback
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Provide haptic feedback on submission
    if (enableHaptic) {
      hapticFeedback.medium();
    }
    
    // Blur active element to dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    onSubmit(e);
  };

  return (
    <div className={cn(
      "w-full",
      // Mobile-specific container optimizations
      isMobile && "pb-safe-bottom", // Account for safe area
      containerClassName
    )}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cn(
          // Base form styling
          "w-full space-y-4",
          
          // Mobile optimizations
          "touch-manipulation",
          
          // Prevent zoom on input focus (iOS)
          "[&_input]:text-base sm:[&_input]:text-sm",
          "[&_textarea]:text-base sm:[&_textarea]:text-sm",
          "[&_select]:text-base sm:[&_select]:text-sm",
          
          // Loading state
          loading && "pointer-events-none opacity-70",
          
          className
        )}
        autoComplete="on"
        noValidate // We handle validation ourselves
        {...props}
      >
        {children}
      </form>
    </div>
  );
}