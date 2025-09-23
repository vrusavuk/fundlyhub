/**
 * Mobile-enhanced button component with haptic feedback
 * Provides better touch experience and accessibility
 */
import React, { useRef, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback, touchUtils } from '@/lib/utils/mobile';

interface MobileEnhancedButtonProps extends ButtonProps {
  enableHaptic?: boolean;
  hapticType?: 'light' | 'medium' | 'strong';
  preventDoubleTab?: boolean;
  touchSize?: 'sm' | 'md' | 'lg';
}

export function MobileEnhancedButton({
  enableHaptic = true,
  hapticType = 'light',
  preventDoubleTab = true,
  touchSize = 'md',
  className,
  onClick,
  children,
  ...props
}: MobileEnhancedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    if (preventDoubleTab) {
      touchUtils.preventDoubleTab(button);
    }

    // Add active state for better mobile feedback
    touchUtils.addActiveState(button);
  }, [preventDoubleTab]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableHaptic) {
      hapticFeedback[hapticType]();
    }
    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      className={cn(
        touchUtils.getTouchClasses(touchSize),
        "transition-all duration-200",
        "active:scale-95", // Visual feedback on press
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}