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
  return (
    <nav aria-label="Progress" className="mb-8">
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
                    'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all font-semibold',
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
                    <Check className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <span className="text-base sm:text-lg">{step.number}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-2 text-xs sm:text-sm font-medium transition-colors text-center',
                    isCurrent && 'text-foreground font-semibold',
                    !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
                <span className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground text-center hidden md:block">
                  {step.description}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
