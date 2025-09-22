import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        console.log('Fetching campaign stats...');

        // Use the new database function to get campaign stats efficiently
        const { data, error } = await supabase
          .rpc('get_campaign_stats');

        if (error) throw error;

        const statsData = data?.[0];
        console.log('Campaign stats from database:', statsData);
        
        const finalStats = {
          activeCampaigns: Number(statsData?.active_campaigns || 0),
          successfulCampaigns: Number(statsData?.closed_campaigns || 0),
          totalFundsRaised: Number(statsData?.total_funds_raised || 0),
          loading: false,
          error: null
        };

        console.log('Final stats:', finalStats);
        setStats(finalStats);

      } catch (error) {
        console.error('Error fetching campaign stats:', error);
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
          console.log('Real-time donation received:', payload);
          // Add a small delay to ensure the database has processed the change
          setTimeout(() => {
            console.log('Refreshing stats due to real-time update');
            fetchStats();
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
    
    // Listen for donation events to refresh stats (fallback)
    const handleDonationMade = () => {
      console.log('Custom donation event received');
      fetchStats();
    };
    
    window.addEventListener('donationMade', handleDonationMade);
    
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      window.removeEventListener('donationMade', handleDonationMade);
    };
  }, []);

  return stats;
}