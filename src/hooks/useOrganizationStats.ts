import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationStats {
  campaignCount: number;
  totalFundsRaised: number;
  followerCount: number;
  loading: boolean;
  error: string | null;
}

export function useOrganizationStats(organizationId: string): OrganizationStats {
  const [stats, setStats] = useState<OrganizationStats>({
    campaignCount: 0,
    totalFundsRaised: 0,
    followerCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!organizationId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Get campaign count
        const { count: campaignCount, error: campaignError } = await supabase
          .from('fundraisers')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', organizationId)
          .eq('status', 'active');

        if (campaignError) throw campaignError;

        // Get follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', organizationId)
          .eq('following_type', 'organization');

        if (followerError) throw followerError;

        // Get fundraiser IDs for this organization
        const { data: orgFundraisers, error: fundraiserError } = await supabase
          .from('fundraisers')
          .select('id')
          .eq('org_id', organizationId);

        if (fundraiserError) throw fundraiserError;

        let totalFundsRaised = 0;
        if (orgFundraisers && orgFundraisers.length > 0) {
          const fundraiserIds = orgFundraisers.map(f => f.id);
          
          // Get total funds raised from stats
          const { data: statsData, error: statsError } = await supabase
            .from('public_fundraiser_stats')
            .select('total_raised')
            .in('fundraiser_id', fundraiserIds);

          if (statsError) throw statsError;

          totalFundsRaised = statsData?.reduce((sum, stat) => {
            return sum + (Number(stat.total_raised) || 0);
          }, 0) || 0;
        }

        setStats({
          campaignCount: campaignCount || 0,
          totalFundsRaised,
          followerCount: followerCount || 0,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching organization stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load organization stats'
        }));
      }
    };

    fetchStats();
  }, [organizationId]);

  return stats;
}