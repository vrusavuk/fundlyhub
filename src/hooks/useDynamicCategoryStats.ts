/**
 * Hook for fetching category statistics from the database
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CategoryStats } from '@/types/category';

export function useDynamicCategoryStats() {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_category_stats');

      if (error) throw error;

      setStats(data || []);
    } catch (err) {
      console.error('Error fetching category stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch category stats');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCategoryStats();
  };

  return {
    stats,
    loading, 
    error,
    refetch
  };
}