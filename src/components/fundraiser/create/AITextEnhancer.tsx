/**
 * AI Text Enhancer Component
 * Simple, integrated AI assistance for text fields
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useAITextEnhancement, AIAction } from '@/hooks/useAITextEnhancement';
import { cn } from '@/lib/utils';

interface AITextEnhancerProps {
  field: 'summary' | 'story';
  currentText: string;
  onTextGenerated: (text: string) => void;
  onSuggestionStateChange?: (hasSuggestion: boolean) => void;
  context: {
    title?: string;
    category?: string;
    goalAmount?: number;
    beneficiaryName?: string;
    summary?: string;
  };
}

export function AITextEnhancer({
  field,
  currentText,
  onTextGenerated,
  onSuggestionStateChange,
  context,
}: AITextEnhancerProps) {
  const { enhanceText, isLoading } = useAITextEnhancement();
  const [suggestedText, setSuggestedText] = useState<string | null>(null);

  const handleGenerate = async () => {
    const action: AIAction = currentText.trim() ? 'refine' : 'generate';
    const result = await enhanceText(action, currentText, {
      field,
      ...context,
    });

    if (result) {
      setSuggestedText(result);
      onSuggestionStateChange?.(true);
    }
  };

  const handleAccept = () => {
    if (suggestedText) {
      onTextGenerated(suggestedText);
      setSuggestedText(null);
      onSuggestionStateChange?.(false);
    }
  };

  const handleReject = () => {
    setSuggestedText(null);
    onSuggestionStateChange?.(false);
  };

  // Return the suggestion text for display
  if (suggestedText) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handleAccept}
          className="gap-1"
        >
          <Check className="h-3 w-3" />
          Accept
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={isLoading}
          className="gap-1"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Regenerate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleReject}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // AI button
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleGenerate}
      disabled={isLoading}
      className={cn(
        "h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary",
        isLoading && "opacity-50"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          {currentText.trim() ? 'Improve with AI' : 'Generate with AI'}
        </>
      )}
    </Button>
  );
}

// Export the suggested text getter
export function useSuggestedText() {
  return useState<string | null>(null);
}
