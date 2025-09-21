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

        // Get campaign counts
        const [activeCountResult, closedCountResult] = await Promise.all([
          supabase
            .from('fundraisers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('visibility', 'public'),
          
          supabase
            .from('fundraisers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'closed')
            .eq('visibility', 'public')
        ]);

        console.log('Active campaigns:', activeCountResult.count);
        console.log('Closed campaigns:', closedCountResult.count);

        if (activeCountResult.error) throw activeCountResult.error;
        if (closedCountResult.error) throw closedCountResult.error;

        // Get donations and calculate total raised
        const [donationsResult, publicFundraisersResult] = await Promise.all([
          supabase
            .from('donations')
            .select('amount, fundraiser_id')
            .eq('payment_status', 'paid'),
          supabase
            .from('fundraisers')
            .select('id')
            .eq('visibility', 'public')
            .in('status', ['active', 'closed'])
        ]);

        console.log('Donations count:', donationsResult.data?.length);
        console.log('Public fundraisers count:', publicFundraisersResult.data?.length);

        let totalRaised = 0;
        if (!donationsResult.error && !publicFundraisersResult.error) {
          const publicIds = new Set(publicFundraisersResult.data?.map(f => f.id) || []);
          const publicDonations = donationsResult.data?.filter(d => publicIds.has(d.fundraiser_id)) || [];
          
          console.log('Public donations count:', publicDonations.length);
          totalRaised = publicDonations.reduce((sum, d) => sum + Number(d.amount), 0);
          console.log('Calculated total raised:', totalRaised);
        }

        const finalStats = {
          activeCampaigns: activeCountResult.count || 0,
          successfulCampaigns: closedCountResult.count || 0,
          totalFundsRaised: totalRaised,
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