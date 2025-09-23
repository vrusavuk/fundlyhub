/**
 * Responsive tour tooltip with adaptive positioning and mobile optimization
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface TooltipPosition {
  top: number;
  left: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  arrow?: {
    position: 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
}

interface ResponsiveTourTooltipProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  currentStep: number;
  totalSteps: number;
  targetElement?: HTMLElement | null;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  isVisible: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export function ResponsiveTourTooltip({
  title,
  description,
  icon: Icon,
  currentStep,
  totalSteps,
  targetElement,
  preferredPosition = 'bottom',
  isVisible,
  onNext,
  onPrevious,
  onClose,
  onSkip,
  isFirstStep,
  isLastStep,
  action,
  className
}: ResponsiveTourTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    position: 'center'
  });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const calculatePosition = useCallback((): TooltipPosition => {
    if (!targetElement || !tooltipRef.current) {
      // Center position when no target
      return {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        position: 'center'
      };
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const spacing = isMobile ? 16 : 20;
    const arrowSize = 12;

    // Calculate available space in each direction
    const spaces = {
      top: targetRect.top,
      bottom: viewport.height - targetRect.bottom,
      left: targetRect.left,
      right: viewport.width - targetRect.right
    };

    // Determine best position based on available space and preference
    let bestPosition: 'top' | 'bottom' | 'left' | 'right' = preferredPosition;
    
    // Override if not enough space in preferred direction
    if (preferredPosition === 'top' && spaces.top < tooltipRect.height + spacing) {
      bestPosition = spaces.bottom > spaces.top ? 'bottom' : 'right';
    } else if (preferredPosition === 'bottom' && spaces.bottom < tooltipRect.height + spacing) {
      bestPosition = spaces.top > spaces.bottom ? 'top' : 'right';
    } else if (preferredPosition === 'left' && spaces.left < tooltipRect.width + spacing) {
      bestPosition = spaces.right > spaces.left ? 'right' : 'bottom';
    } else if (preferredPosition === 'right' && spaces.right < tooltipRect.width + spacing) {
      bestPosition = spaces.left > spaces.right ? 'left' : 'bottom';
    }

    let top = 0;
    let left = 0;
    let arrow: TooltipPosition['arrow'];

    switch (bestPosition) {
      case 'top':
        top = targetRect.top - tooltipRect.height - spacing;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        arrow = {
          position: 'bottom',
          offset: targetRect.width / 2
        };
        break;
        
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        arrow = {
          position: 'top',
          offset: targetRect.width / 2
        };
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - spacing;
        arrow = {
          position: 'right',
          offset: targetRect.height / 2
        };
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + spacing;
        arrow = {
          position: 'left',
          offset: targetRect.height / 2
        };
        break;
    }

    // Keep tooltip within viewport bounds
    const margin = isMobile ? 16 : 24;
    top = Math.max(margin, Math.min(top, viewport.height - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, viewport.width - tooltipRect.width - margin));

    return {
      top,
      left,
      position: bestPosition,
      arrow
    };
  }, [targetElement, preferredPosition, isMobile]);

  // Recalculate position when dependencies change
  useEffect(() => {
    if (!isVisible) {
      setIsPositioned(false);
      return;
    }

    // Small delay to ensure tooltip is rendered
    const timer = setTimeout(() => {
      const newPosition = calculatePosition();
      setPosition(newPosition);
      setIsPositioned(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [isVisible, targetElement, calculatePosition]);

  // Recalculate on resize
  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, calculatePosition]);

  if (!isVisible) return null;

  const ArrowIcon = {
    top: ChevronUp,
    bottom: ChevronDown,
    left: ChevronLeft,
    right: ChevronRight
  }[position.arrow?.position || 'bottom'];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
      
      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] shadow-2xl border-2 border-primary/20 bg-background',
          'animate-scale-in transition-all duration-300',
          isMobile ? 'w-[calc(100vw-2rem)] max-w-sm' : 'w-80 max-w-md',
          !isPositioned && 'opacity-0',
          className
        )}
        style={{
          top: position.position === 'center' ? '50%' : `${position.top}px`,
          left: position.position === 'center' ? '50%' : `${position.left}px`,
          transform: position.position === 'center' ? 'translate(-50%, -50%)' : undefined
        }}
      >
        {/* Arrow */}
        {position.arrow && targetElement && (
          <div
            className={cn(
              'absolute w-0 h-0 border-8',
              position.arrow.position === 'top' && 'border-b-background border-t-transparent border-l-transparent border-r-transparent -top-4',
              position.arrow.position === 'bottom' && 'border-t-background border-b-transparent border-l-transparent border-r-transparent -bottom-4',
              position.arrow.position === 'left' && 'border-r-background border-l-transparent border-t-transparent border-b-transparent -left-4',
              position.arrow.position === 'right' && 'border-l-background border-r-transparent border-t-transparent border-b-transparent -right-4'
            )}
            style={{
              [position.arrow.position === 'top' || position.arrow.position === 'bottom' ? 'left' : 'top']: 
                `${Math.min(Math.max(position.arrow.offset - 8, 8), 200)}px`
            }}
          />
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary flex-shrink-0" />
              <CardTitle className={cn(
                'leading-tight',
                isMobile ? 'text-base' : 'text-lg'
              )}>
                {title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="outline" className="w-fit">
            Step {currentStep + 1} of {totalSteps}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className={cn(
            'text-muted-foreground leading-relaxed',
            isMobile ? 'text-sm' : 'text-sm'
          )}>
            {description}
          </p>

          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="w-full animate-fade-in"
            >
              {action.text}
            </Button>
          )}

          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className={cn(
            'flex justify-between',
            isMobile ? 'gap-2' : 'gap-3'
          )}>
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'sm'}
              onClick={onPrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && 'Previous'}
            </Button>

            <Button
              onClick={onNext}
              size={isMobile ? 'sm' : 'sm'}
              className="flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  Complete
                  {!isMobile && <ArrowRight className="h-4 w-4" />}
                </>
              ) : (
                <>
                  {!isMobile && 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className={cn(
                'w-full text-muted-foreground',
                isMobile ? 'text-xs' : 'text-xs'
              )}
            >
              Skip tour
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
