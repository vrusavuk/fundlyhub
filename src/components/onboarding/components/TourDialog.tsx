/**
 * Tour dialog component with improved accessibility and UX
 */
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { TourDialogProps } from '../types';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

export function TourDialog({
  step,
  state,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onClose,
  onAction
}: TourDialogProps) {
  const isMobile = useIsMobile();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [state.currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isActive) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!state.isNavigating) {
            event.preventDefault();
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (!state.isNavigating && !isFirstStep) {
            event.preventDefault();
            onPrevious();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, state.isNavigating, isFirstStep, onNext, onPrevious, onClose]);

  const handleActionClick = () => {
    if (step.action && onAction) {
      onAction(step.action);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-md bg-background/95 backdrop-blur-sm shadow-2xl border-2 border-primary/10',
          'animate-scale-in transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        aria-modal="true"
      >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <step.icon className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
            <CardTitle 
              id="tour-title"
              className={cn(
                'leading-tight',
                isMobile ? 'text-base' : 'text-lg'
              )}
            >
              {step.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="outline" className="w-fit">
          Step {state.currentStep + 1} of {state.steps.length}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <p 
          id="tour-description"
          className="text-sm text-muted-foreground leading-relaxed"
        >
          {step.description}
        </p>

        {step.action && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleActionClick}
            className="w-full"
            disabled={state.isNavigating}
            aria-describedby="tour-description"
          >
            {step.action.text}
          </Button>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center" role="progressbar" aria-valuenow={state.currentStep + 1} aria-valuemax={state.steps.length}>
          <div className="flex gap-1">
            {Array.from({ length: state.steps.length }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors duration-200',
                  index === state.currentStep ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
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
            disabled={isFirstStep || state.isNavigating}
            className="flex items-center gap-2"
            aria-label={isFirstStep ? "First step" : "Previous step"}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && 'Previous'}
          </Button>

          <Button
            onClick={onNext}
            size="sm"
            disabled={state.isNavigating}
            className="flex items-center gap-2"
            aria-label={isLastStep ? "Complete tour" : "Next step"}
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
          disabled={state.isNavigating}
        >
          Skip tour
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}