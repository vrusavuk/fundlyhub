/**
 * AI Text Enhancer Wrapper with Feature Gate
 */

import { AITextEnhancer } from './AITextEnhancer';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface AITextEnhancerWrapperProps {
  field: 'summary' | 'story';
  currentText: string;
  onTextGenerated: (text: string) => void;
  onSuggestionChange?: (suggestion: string | null) => void;
  context: {
    title?: string;
    category?: string;
    goalAmount?: number;
    beneficiaryName?: string;
    summary?: string;
  };
}

export function AITextEnhancerWrapper({ field, currentText, onTextGenerated, onSuggestionChange, context }: AITextEnhancerWrapperProps) {
  const { canUseAIEnhancement } = useFeatureFlags();

  if (!canUseAIEnhancement) {
    return null;
  }

  return <AITextEnhancer field={field} currentText={currentText} onTextGenerated={onTextGenerated} onSuggestionChange={onSuggestionChange} context={context} />;
}
