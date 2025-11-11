/**
 * AI Text Enhancement Hook
 * Handles AI-powered text generation and refinement
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/services/logger.service';

export type AIAction = 'generate' | 'refine' | 'expand' | 'shorten';

interface AIContext {
  field: 'summary' | 'story' | 'milestone';
  title?: string;
  category?: string;
  goalAmount?: number;
  beneficiaryName?: string;
  summary?: string;
  milestoneTitle?: string;
  milestoneAmount?: number;
}

interface UseAITextEnhancementReturn {
  enhanceText: (action: AIAction, text: string, context: AIContext) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useAITextEnhancement(): UseAITextEnhancementReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const enhanceText = async (
    action: AIAction,
    text: string,
    context: AIContext
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'enhance-fundraiser-text',
        {
          body: {
            action,
            text,
            context,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.enhancedText) {
        throw new Error('No enhanced text received');
      }

      return data.enhancedText;
    } catch (err: any) {
      logger.error('AI enhancement error', err, {
        componentName: 'useAITextEnhancement',
        operationName: 'enhanceText',
        metadata: { action, field: context.field }
      });
      const errorMessage = err.message || 'Failed to enhance text';
      setError(errorMessage);
      
      toast({
        title: 'AI Enhancement Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enhanceText,
    isLoading,
    error,
  };
}
