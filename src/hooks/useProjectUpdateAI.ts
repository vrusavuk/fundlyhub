/**
 * Hook for AI-powered project update enhancement
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ProjectUpdateAIAction = 'generate' | 'improve' | 'shorten' | 'expand';

interface AIContext {
  fundraiserTitle: string;
  fundraiserId: string;
  milestoneTitle?: string;
  previousUpdates?: string[];
}

interface UseProjectUpdateAIReturn {
  enhanceText: (action: ProjectUpdateAIAction, text: string, context: AIContext) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useProjectUpdateAI(): UseProjectUpdateAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const enhanceText = async (
    action: ProjectUpdateAIAction,
    text: string,
    context: AIContext
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'enhance-project-update',
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
      console.error('AI enhancement error:', err);
      const errorMessage = err.message || 'Failed to enhance text with AI';
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
