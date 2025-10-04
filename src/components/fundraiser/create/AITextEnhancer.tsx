/**
 * AI Text Enhancer Component
 * Provides AI-powered text generation and refinement via a floating button
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ArrowUpDown, Check, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAITextEnhancement, AIAction } from '@/hooks/useAITextEnhancement';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const [isOpen, setIsOpen] = useState(false);
  
  const hasText = currentText.trim().length > 0;

  const handleEnhance = async (action: AIAction) => {
    setLastAction(action);
    setIsOpen(false);
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

  // Show suggestion overlay if we have a suggestion
  if (suggestedText) {
    return (
      <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm rounded-md border-2 border-primary shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">AI Suggestion</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReject}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Suggestion content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{suggestedText}</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 p-3 border-t border-border bg-accent/20">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerate}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </div>
      </div>
    );
  }

  // Show floating AI button
  return (
    <div className={className}>
      {hasText ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleEnhance('refine')}
                disabled={isLoading}
                className="justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refine
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleEnhance(currentText.length < (field === 'summary' ? 100 : 500) ? 'expand' : 'shorten')}
                disabled={isLoading}
                className="justify-start"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {currentText.length < (field === 'summary' ? 100 : 500) ? 'Expand' : 'Shorten'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => handleEnhance('generate')}
          disabled={isLoading}
          className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
        </Button>
      )}
    </div>
  );
}
