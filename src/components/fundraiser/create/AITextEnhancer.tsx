/**
 * AI Text Enhancer Component
 * Provides AI-powered text generation and refinement
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ArrowUpDown, Check, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAITextEnhancement, AIAction } from '@/hooks/useAITextEnhancement';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AITextEnhancerProps {
  field: 'summary' | 'story';
  currentText: string;
  onTextGenerated: (text: string) => void;
  context: {
    title?: string;
    category?: string;
    goalAmount?: number;
    beneficiaryName?: string;
    summary?: string;
  };
  className?: string;
}

export function AITextEnhancer({
  field,
  currentText,
  onTextGenerated,
  context,
  className,
}: AITextEnhancerProps) {
  const { enhanceText, isLoading } = useAITextEnhancement();
  const [suggestedText, setSuggestedText] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<AIAction | null>(null);

  const handleEnhance = async (action: AIAction) => {
    setLastAction(action);
    const result = await enhanceText(action, currentText, {
      field,
      ...context,
    });

    if (result) {
      setSuggestedText(result);
    }
  };

  const handleAccept = () => {
    if (suggestedText) {
      onTextGenerated(suggestedText);
      setSuggestedText(null);
      setLastAction(null);
    }
  };

  const handleReject = () => {
    setSuggestedText(null);
    setLastAction(null);
  };

  const handleRegenerate = () => {
    if (lastAction) {
      handleEnhance(lastAction);
    }
  };

  // Show suggestion UI if we have a suggestion
  if (suggestedText) {
    return (
      <div className={cn('space-y-3 p-4 border rounded-lg bg-accent/50', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggestion
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
        <p className="text-sm bg-background p-3 rounded border">
          {suggestedText}
        </p>
      </div>
    );
  }

  // Show action buttons
  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap gap-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleEnhance('generate')}
              disabled={isLoading}
              className="flex-1 min-w-[120px]"
            >
              {isLoading && lastAction === 'generate' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate new text using AI</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleEnhance('refine')}
              disabled={isLoading || !currentText}
              className="flex-1 min-w-[120px]"
            >
              {isLoading && lastAction === 'refine' ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refine
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Improve existing text</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleEnhance(currentText.length < (field === 'summary' ? 100 : 500) ? 'expand' : 'shorten')}
              disabled={isLoading || !currentText}
              className="flex-1 min-w-[120px]"
            >
              {isLoading && (lastAction === 'expand' || lastAction === 'shorten') ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ArrowUpDown className="h-4 w-4 mr-2" />
              )}
              Adjust Length
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Expand or shorten text</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
