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

        // Get all fundraisers (active and closed) with their donation totals
        const { data: fundraisers, error: fundraisersError } = await supabase
          .from('fundraisers')
          .select('id, goal_amount, status')
          .in('status', ['active', 'closed'])
          .eq('visibility', 'public');

        if (fundraisersError) throw fundraisersError;

        // Get all donations for these fundraisers
        const { data: donations, error: donationsError } = await supabase
          .from('donations')
          .select('fundraiser_id, amount')
          .eq('payment_status', 'paid')
          .in('fundraiser_id', fundraisers?.map(f => f.id) || []);

        if (donationsError) throw donationsError;

        // Calculate totals
        const fundraiserTotals = new Map<string, number>();
        donations?.forEach(donation => {
          const currentTotal = fundraiserTotals.get(donation.fundraiser_id) || 0;
          fundraiserTotals.set(donation.fundraiser_id, currentTotal + Number(donation.amount));
        });

        // Calculate total funds raised from all campaigns
        let totalRaised = 0;
        fundraisers?.forEach(fundraiser => {
          const raised = fundraiserTotals.get(fundraiser.id) || 0;
          totalRaised += raised;
        });

        setStats({
          activeCampaigns: activeCount || 0,
          successfulCampaigns: closedCount || 0, // Show closed campaigns instead of successful ones
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
  }, []);

  return stats;
}