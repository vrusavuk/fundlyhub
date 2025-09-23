/**
 * Animated button component with enhanced micro-interactions
 */
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';

interface AnimatedButtonProps extends ButtonProps {
  ripple?: boolean;
  pulse?: boolean;
  bounce?: boolean;
  haptic?: boolean;
}

export function AnimatedButton({
  children,
  className,
  ripple = true,
  pulse = false,
  bounce = false,
  haptic = true,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      hapticFeedback.medium();
    }
    
    // Add ripple effect
    if (ripple) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const rippleElement = document.createElement('span');
      rippleElement.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      button.appendChild(rippleElement);
      setTimeout(() => rippleElement.remove(), 600);
    }
    
    onClick?.(e);
  };

  return (
    <Button
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:shadow-md active:scale-95',
        pulse && 'animate-pulse-subtle',
        bounce && 'hover:animate-bounce',
        className
      )}
      onClick={handleClick}
      style={{
        // Add ripple keyframes via CSS custom properties
      } as React.CSSProperties}
      {...props}
    >
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
      {children}
    </Button>
  );
}