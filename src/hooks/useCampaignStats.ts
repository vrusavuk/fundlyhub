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

        // Get active campaigns count
        const { count: activeCount, error: activeError } = await supabase
          .from('fundraisers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('visibility', 'public');

        if (activeError) throw activeError;

        // Get closed campaigns count
        const { count: closedCount, error: closedError } = await supabase
          .from('fundraisers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'closed')
          .eq('visibility', 'public');

        if (closedError) throw closedError;

        // Get all donations to calculate total funds raised
        const { data: allDonations, error: donationsError } = await supabase
          .from('donations')
          .select('amount, fundraiser_id, fundraisers!inner(status, visibility)')
          .eq('payment_status', 'paid')
          .eq('fundraisers.visibility', 'public')
          .in('fundraisers.status', ['active', 'closed']);

        if (donationsError) throw donationsError;

        // Calculate total funds raised across all campaigns
        const totalRaised = allDonations?.reduce((sum, donation) => {
          return sum + Number(donation.amount);
        }, 0) || 0;

        setStats({
          activeCampaigns: activeCount || 0,
          successfulCampaigns: closedCount || 0,
          totalFundsRaised: totalRaised,
          loading: false,
          error: null
        });

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
    
    // Listen for donation events to refresh stats
    const handleDonationMade = () => {
      fetchStats();
    };
    
    window.addEventListener('donationMade', handleDonationMade);
    
    return () => {
      window.removeEventListener('donationMade', handleDonationMade);
    };
  }, []);

  return stats;
}