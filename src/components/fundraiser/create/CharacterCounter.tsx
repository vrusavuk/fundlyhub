/**
 * Character Counter Component
 * Shows real-time character count with visual feedback
 */

import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  min?: number;
  max: number;
  showMinimum?: boolean;
  className?: string;
}

export function CharacterCounter({
  current,
  min,
  max,
  showMinimum = false,
  className,
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isUnderMin = min !== undefined && current < min;
  const isOverMax = current > max;
  const isWarning = percentage > 80 && !isOverMax;

  return (
    <div className={cn('flex items-center justify-between text-sm', className)}>
      <span
        className={cn(
          'transition-colors',
          isOverMax && 'text-destructive font-medium',
          isWarning && 'text-warning',
          isUnderMin && 'text-muted-foreground',
          !isOverMax && !isWarning && !isUnderMin && 'text-muted-foreground'
        )}
      >
        {showMinimum && min !== undefined && (
          <>
            {current < min ? (
              <span>
                {min - current} more character{min - current !== 1 ? 's' : ''} needed
              </span>
            ) : (
              <span className="text-success">✓ Minimum reached</span>
            )}
          </>
        )}
      </span>
      <span
        className={cn(
          'font-medium transition-colors',
          isOverMax && 'text-destructive',
          isWarning && 'text-warning',
          !isOverMax && !isWarning && 'text-muted-foreground'
        )}
      >
        {current} / {max}
      </span>
    </div>
  );
}
