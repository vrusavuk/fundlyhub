/**
 * Progress Indicator Component
 * Shows wizard progress with clickable steps
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface ProgressIndicatorProps {
  currentStep: number;
  steps: Step[];
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export function ProgressIndicator({
  currentStep,
  steps,
  onStepClick,
  completedSteps,
}: ProgressIndicatorProps) {
  const progress = ((completedSteps.length + 1) / steps.length) * 100;
  
  return (
    <nav aria-label="Progress" className="space-y-2 mb-4 sm:mb-6">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5">
          <span className="font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
      
      {/* Step Indicators */}
      <ol className="flex items-center justify-between w-full max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number) && step.number !== currentStep;
          const isCurrent = currentStep === step.number;
          const isClickable = step.number < currentStep || isCompleted;

          return (
            <li
              key={step.number}
              className={cn(
                'relative flex-1',
                index !== steps.length - 1 && 'pr-8'
              )}
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-[calc(50%+1.25rem)] right-[-0.75rem] h-0.5 transition-colors hidden sm:block',
                    (isCompleted || step.number < currentStep) ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center group transition-all w-full',
                  isClickable && 'cursor-pointer active:scale-95',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all font-semibold',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground shadow-lg scale-110',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    !isCurrent &&
                      !isCompleted &&
                      'border-muted-foreground/30 bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm sm:text-base">{step.number}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] sm:text-xs font-medium transition-colors text-center',
                    isCurrent && 'text-foreground font-semibold',
                    !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
