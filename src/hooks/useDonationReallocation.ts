import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReallocationResult {
  success: boolean;
  error?: string;
  reallocation_id?: string;
  donation_id?: string;
  source_fundraiser_id?: string;
  target_fundraiser_id?: string;
  amount?: number;
  target_campaign_title?: string;
}

export function useDonationReallocation() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const reallocateDonation = async (
    donationId: string,
    targetFundraiserId: string,
    reason: string
  ): Promise<ReallocationResult> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('reallocate_donation', {
        p_donation_id: donationId,
        p_target_fundraiser_id: targetFundraiserId,
        p_reason: reason
      });

      if (error) {
        throw error;
      }

      const result = data as unknown as ReallocationResult;

      if (!result.success) {
        throw new Error(result.error || 'Failed to reallocate donation');
      }

      toast({
        title: 'Donation Reallocated',
        description: `Successfully moved donation to "${result.target_campaign_title}"`,
      });

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reallocate donation';
      
      toast({
        variant: 'destructive',
        title: 'Reallocation Failed',
        description: errorMessage,
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const reallocateMultiple = async (
    donationIds: string[],
    targetFundraiserId: string,
    reason: string
  ): Promise<{ successful: number; failed: number }> => {
    setIsLoading(true);
    let successful = 0;
    let failed = 0;

    try {
      for (const donationId of donationIds) {
        const result = await reallocateDonation(donationId, targetFundraiserId, reason);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      if (successful > 0) {
        toast({
          title: 'Bulk Reallocation Complete',
          description: `${successful} donation(s) reallocated successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }

      return { successful, failed };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reallocateDonation,
    reallocateMultiple,
    isLoading
  };
}
