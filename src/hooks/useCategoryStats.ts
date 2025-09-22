import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryStat {
  name: string;
  count: number;
  raised: number;
}

interface CategoryStatsReturn {
  stats: Record<string, CategoryStat>;
  loading: boolean;
  error: string | null;
}

export function useCategoryStats(): CategoryStatsReturn {
  const [data, setData] = useState<CategoryStatsReturn>({
    stats: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Get all active fundraisers with their categories
        const { data: fundraisers, error: fundraiserError } = await supabase
          .from('fundraisers')
          .select('id, category')
          .eq('status', 'active')
          .eq('visibility', 'public');

        if (fundraiserError) throw fundraiserError;

        // Get all fundraiser stats
        const { data: statsData, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('fundraiser_id, total_raised');

        if (statsError) throw statsError;

        // Create a map of fundraiser_id to total_raised
        const raisedMap = new Map();
        statsData?.forEach(stat => {
          raisedMap.set(stat.fundraiser_id, Number(stat.total_raised) || 0);
        });

        // Group by category and calculate totals
        const categoryStats: Record<string, CategoryStat> = {};
        
        fundraisers?.forEach(fundraiser => {
          const category = fundraiser.category || 'Other';
          const raised = raisedMap.get(fundraiser.id) || 0;

          if (!categoryStats[category]) {
            categoryStats[category] = {
              name: category,
              count: 0,
              raised: 0
            };
          }

          categoryStats[category].count += 1;
          categoryStats[category].raised += raised;
        });

        setData({
          stats: categoryStats,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching category stats:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load category stats'
        }));
      }
    };

    fetchCategoryStats();
  }, []);

  return data;
}