/**
 * Animated card component with contextual micro-interactions
 */
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  hover?: boolean;
  scale?: boolean;
  lift?: boolean;
  glow?: boolean;
  delay?: number;
  interactive?: boolean;
  onHover?: () => void;
  onFocus?: () => void;
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  scale = true,
  lift = true,
  glow = false,
  delay = 0,
  interactive = false,
  onHover,
  onFocus,
  ...props
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.();
    if (interactive) {
      hapticFeedback.light();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <Card
      className={cn(
        // Base animation styles
        'transition-all duration-300 ease-out',
        'animate-fade-in',
        
        // Hover effects
        hover && [
          'hover:shadow-lg',
          scale && 'hover:scale-[1.02]',
          lift && 'hover:-translate-y-1',
          glow && 'hover:shadow-primary/20'
        ],
        
        // Focus effects
        'focus-within:ring-2 focus-within:ring-primary/20',
        'focus-within:border-primary/50',
        
        // State-based styles
        isHovered && glow && 'shadow-primary/20',
        isFocused && 'ring-2 ring-primary/20 border-primary/50',
        
        // Interactive cursor
        interactive && 'cursor-pointer',
        
        className
      )}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </Card>
  );
}