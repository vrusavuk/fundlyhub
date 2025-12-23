import { useRef, useState, useEffect } from 'react';
import { tipFeedbackConfig, TipMood } from '@/config/tipFeedbackConfig';

export interface TipFeedback {
  message: string;
  styles: string;
  showHeart: boolean;
  animationKey: number;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNumericValue(value: number | 'custom', customValue: number): number {
  return value === 'custom' ? customValue : value;
}

function determineMood(
  tipAmount: number,
  direction: 'up' | 'down' | 'same'
): TipMood {
  if (tipAmount === 0) return 'none';
  if (direction === 'up') return 'thrilled';
  if (direction === 'down') return 'understanding';
  return 'grateful';
}

export function useTipFeedback(
  tipPercentage: number | 'custom',
  tipAmount: number,
  customTipValue: number
) {
  const prevTipRef = useRef<{ percentage: number | 'custom'; amount: number }>({
    percentage: tipPercentage,
    amount: tipAmount,
  });
  
  const [feedback, setFeedback] = useState<TipFeedback>(() => {
    const mood = tipAmount > 0 ? 'grateful' : 'none';
    const config = tipFeedbackConfig[mood];
    return {
      message: randomPick(config.messages),
      styles: config.styles,
      showHeart: config.showHeart,
      animationKey: Date.now(),
    };
  });

  useEffect(() => {
    const prevAmount = prevTipRef.current.amount;
    const currentAmount = tipAmount;

    // Determine direction based on actual tip amount change
    let direction: 'up' | 'down' | 'same' = 'same';
    if (currentAmount > prevAmount) {
      direction = 'up';
    } else if (currentAmount < prevAmount) {
      direction = 'down';
    }

    const mood = determineMood(currentAmount, direction);
    const config = tipFeedbackConfig[mood];

    // Only update if there's an actual change
    if (currentAmount !== prevAmount || tipPercentage !== prevTipRef.current.percentage) {
      setFeedback({
        message: randomPick(config.messages),
        styles: config.styles,
        showHeart: config.showHeart,
        animationKey: Date.now(),
      });
    }

    prevTipRef.current = { percentage: tipPercentage, amount: currentAmount };
  }, [tipPercentage, tipAmount, customTipValue]);

  return feedback;
}
