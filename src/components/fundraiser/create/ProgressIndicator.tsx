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
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isClickable = step.number <= currentStep || isCompleted;

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
                    'absolute top-5 left-[calc(50%+1rem)] right-[-1rem] h-0.5 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center group transition-all',
                  isClickable && 'cursor-pointer hover:scale-105',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground shadow-glow',
                    isCompleted &&
                      !isCurrent &&
                      'border-primary bg-primary text-primary-foreground',
                    !isCurrent &&
                      !isCompleted &&
                      'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium transition-colors text-center',
                    isCurrent && 'text-foreground',
                    !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
                <span className="mt-1 text-xs text-muted-foreground text-center hidden sm:block">
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
