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

        // Get campaign counts and donations using the join approach
        const [activeCountResult, closedCountResult, donationsResult] = await Promise.all([
          // Get active campaigns count
          supabase
            .from('fundraisers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('visibility', 'public'),
          
          // Get closed campaigns count  
          supabase
            .from('fundraisers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'closed')
            .eq('visibility', 'public'),
          
          // Get donations using inner join to only include public campaigns
          supabase
            .from('donations')
            .select('amount, fundraisers!inner(status, visibility)')
            .eq('payment_status', 'paid')
            .eq('fundraisers.visibility', 'public')
            .in('fundraisers.status', ['active', 'closed'])
        ]);

        if (activeCountResult.error) throw activeCountResult.error;
        if (closedCountResult.error) throw closedCountResult.error;
        if (donationsResult.error) throw donationsResult.error;

        // Calculate total funds raised from public campaigns
        const totalRaised = donationsResult.data?.reduce((sum: number, item: any) => {
          return sum + Number(item.amount);
        }, 0) || 0;

        setStats({
          activeCampaigns: activeCountResult.count || 0,
          successfulCampaigns: closedCountResult.count || 0,
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