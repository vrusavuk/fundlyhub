/**
 * Simple tour dialog component with fixed positioning
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

interface TourDialogProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isNavigating: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function TourDialog({
  title,
  description,
  icon: Icon,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  isNavigating,
  onNext,
  onPrevious,
  onClose,
  action
}: TourDialogProps) {
  const isMobile = useIsMobile();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <Card className={cn(
        'relative w-full max-w-md bg-background shadow-2xl',
        'animate-scale-in'
      )}>
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="w-full"
              disabled={isNavigating}
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
                    'h-2 w-2 rounded-full transition-colors duration-200',
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={isFirstStep || isNavigating}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {!isMobile && 'Previous'}
            </Button>

            <Button
              onClick={onNext}
              size="sm"
              disabled={isNavigating}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full text-muted-foreground text-xs"
            disabled={isNavigating}
          >
            Skip tour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}