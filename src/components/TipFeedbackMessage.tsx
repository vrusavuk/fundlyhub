import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TipFeedback } from '@/hooks/useTipFeedback';

interface TipFeedbackMessageProps {
  feedback: TipFeedback;
  className?: string;
}

export function TipFeedbackMessage({ feedback, className }: TipFeedbackMessageProps) {
  if (!feedback.message) return null;

  return (
    <div
      key={feedback.animationKey}
      className={cn(
        "flex items-center gap-2 text-sm rounded-md p-2 transition-all duration-300 animate-fade-in",
        feedback.styles,
        className
      )}
    >
      {feedback.showHeart && <Heart className="h-4 w-4 fill-current flex-shrink-0" />}
      <span>{feedback.message}</span>
    </div>
  );
}
