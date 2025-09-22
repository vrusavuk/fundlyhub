import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FundraiserStat {
  fundraiserId: string;
  donorCount: number;
  daysLeft: number | null;
  totalRaised: number;
}

interface FundraiserStatsReturn {
  stats: Record<string, FundraiserStat>;
  loading: boolean;
  error: string | null;
}

export function useFundraiserStats(fundraiserIds: string[]): FundraiserStatsReturn {
  const [data, setData] = useState<FundraiserStatsReturn>({
    stats: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!fundraiserIds.length) {
      setData({ stats: {}, loading: false, error: null });
      return;
    }

    const fetchStats = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Get fundraiser details including end dates
        const { data: fundraisers, error: fundraiserError } = await supabase
          .from('fundraisers')
          .select('id, end_date')
          .in('id', fundraiserIds);

        if (fundraiserError) throw fundraiserError;

        // Get donation stats
        const { data: statsData, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('fundraiser_id, donor_count, total_raised')
          .in('fundraiser_id', fundraiserIds);

        if (statsError) throw statsError;

        // Create stats map
        const statsMap: Record<string, FundraiserStat> = {};

        fundraisers?.forEach(fundraiser => {
          const stat = statsData?.find(s => s.fundraiser_id === fundraiser.id);
          
          // Calculate days left
          let daysLeft: number | null = null;
          if (fundraiser.end_date) {
            const endDate = new Date(fundraiser.end_date);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }

          statsMap[fundraiser.id] = {
            fundraiserId: fundraiser.id,
            donorCount: Number(stat?.donor_count) || 0,
            daysLeft,
            totalRaised: Number(stat?.total_raised) || 0
          };
        });

        setData({
          stats: statsMap,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching fundraiser stats:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load fundraiser stats'
        }));
      }
    };

    fetchStats();
  }, [fundraiserIds.join(',')]);

  return data;
}