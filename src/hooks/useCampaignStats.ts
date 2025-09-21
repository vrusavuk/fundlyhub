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

        // Get campaign counts first
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

        if (activeCountResult.error) {
          console.error('Active count error:', activeCountResult.error);
          throw activeCountResult.error;
        }
        if (closedCountResult.error) {
          console.error('Closed count error:', closedCountResult.error);
          throw closedCountResult.error;
        }

        // Calculate total raised using a direct SQL approach via RPC or simple calculation
        let totalRaised = 0;
        
        try {
          // Try to get donations with a simpler approach
          const donationsQuery = await supabase
            .from('donations')
            .select('amount')
            .eq('payment_status', 'paid');

          if (!donationsQuery.error && donationsQuery.data) {
            // Get all public fundraiser IDs
            const publicFundraisersQuery = await supabase
              .from('fundraisers')
              .select('id')
              .eq('visibility', 'public')
              .in('status', ['active', 'closed']);

            if (!publicFundraisersQuery.error && publicFundraisersQuery.data) {
              const publicIds = new Set(publicFundraisersQuery.data.map(f => f.id));
              
              // Get donations for these fundraisers
              const publicDonationsQuery = await supabase
                .from('donations')
                .select('amount, fundraiser_id')
                .eq('payment_status', 'paid');

              if (!publicDonationsQuery.error && publicDonationsQuery.data) {
                totalRaised = publicDonationsQuery.data
                  .filter(d => publicIds.has(d.fundraiser_id))
                  .reduce((sum, d) => sum + Number(d.amount), 0);
              }
            }
          }
        } catch (donationError) {
          console.error('Error calculating donations:', donationError);
          // Fallback to 0 if there's an error
          totalRaised = 0;
        }

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