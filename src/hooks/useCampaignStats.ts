import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/services/logger.service';

interface CampaignStats {
  activeCampaigns: number;
  successfulCampaigns: number; // This will now represent closed campaigns
  totalFundsRaised: number;
  loading: boolean;
  error: string | null;
}

export function useCampaignStats() {
  const [stats, setStats] = useState<CampaignStats>({
    activeCampaigns: 0,
    successfulCampaigns: 0,
    totalFundsRaised: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Use the new database function to get campaign stats efficiently
        const { data, error } = await supabase
          .rpc('get_campaign_stats');

        if (error) throw error;

        const statsData = data?.[0];
        
        const finalStats = {
          activeCampaigns: Number(statsData?.active_campaigns || 0),
          successfulCampaigns: Number(statsData?.closed_campaigns || 0),
          totalFundsRaised: Number(statsData?.total_funds_raised || 0),
          loading: false,
          error: null
        };

        setStats(finalStats);

      } catch (error) {
        logger.error('Error fetching campaign stats', error as Error, {
          componentName: 'useCampaignStats',
          operationName: 'fetchStats'
        });
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats'
        }));
      }
    }

    fetchStats();
    
    // Set up real-time subscription for donations
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations'
        },
        (payload) => {
          // Add a small delay to ensure the database has processed the change
          setTimeout(() => {
            fetchStats();
          }, 1000);
        }
      )
      .subscribe();
    
    // Listen for donation events to refresh stats (fallback)
    const handleDonationMade = () => {
      fetchStats();
    };
    
    window.addEventListener('donationMade', handleDonationMade);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('donationMade', handleDonationMade);
    };
  }, []);

  return stats;
}