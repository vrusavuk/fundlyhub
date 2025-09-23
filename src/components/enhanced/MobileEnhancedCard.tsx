/**
 * Mobile-enhanced card component with better touch interactions
 * Provides optimized spacing, touch feedback, and responsive design
 */
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticFeedback, breakpointUtils, touchUtils } from '@/lib/utils/mobile';

interface MobileEnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  enableHaptic?: boolean;
  enableTouchFeedback?: boolean;
  onCardClick?: () => void;
  mobileSpacing?: boolean;
  touchable?: boolean;
}

export function MobileEnhancedCard({
  enableHaptic = true,
  enableTouchFeedback = true,
  onCardClick,
  mobileSpacing = true,
  touchable = false,
  className,
  children,
  ...props
}: MobileEnhancedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = breakpointUtils.isMobile();

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !enableTouchFeedback) return;

    if (touchable || onCardClick) {
      touchUtils.addActiveState(card, 'scale-[0.98] opacity-90');
      touchUtils.preventDoubleTab(card);
    }
  }, [enableTouchFeedback, touchable, onCardClick]);

  const handleClick = () => {
    if (enableHaptic) {
      hapticFeedback.light();
    }
    onCardClick?.();
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        // Base styling
        "transition-all duration-200",
        
        // Mobile-optimized spacing
        mobileSpacing && "mobile-card-spacing",
        
        // Interactive styling
        (touchable || onCardClick) && [
          "cursor-pointer",
          "hover:shadow-md",
          "active:scale-[0.98]",
          "select-none",
          touchUtils.getTouchClasses('md')
        ],
        
        // Mobile-specific enhancements
        isMobile && [
          "touch-manipulation",
          "tap-highlight-transparent"
        ],
        
        className
      )}
      onClick={onCardClick ? handleClick : undefined}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      {...props}
    >
      {children}
    </Card>
  );
}