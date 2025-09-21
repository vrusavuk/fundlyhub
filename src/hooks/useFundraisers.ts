/**
 * Custom hook for managing fundraiser data fetching and state
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchFundraisers, 
  fetchDonationTotals,
  type FundraiserQueryOptions 
} from '@/lib/api/fundraisers';
import type { Fundraiser } from '@/types/fundraiser';

interface UseFundraisersReturn {
  fundraisers: Fundraiser[];
  donations: Record<string, number>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFundraisers(options: FundraiserQueryOptions = {}): UseFundraisersReturn {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [donations, setDonations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = options.limit || 12;

  const loadFundraisers = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(!isLoadMore);
      setError(null);

      const currentOffset = isLoadMore ? offset : 0;
      
      // Fetch fundraisers and donations in parallel for consistency
      const [fundraiserData, donationData] = await Promise.all([
        fetchFundraisers({
          ...options,
          offset: currentOffset,
          limit
        }),
        // Always fetch donations for all fundraisers to ensure consistency
        supabase
          .from('donations')
          .select('fundraiser_id, amount')
          .eq('payment_status', 'paid')
      ]);

      if (fundraiserData.length < limit) {
        setHasMore(false);
      }

      const newFundraisers = isLoadMore ? [...fundraisers, ...fundraiserData] : fundraiserData;
      setFundraisers(newFundraisers as Fundraiser[]);

      // Calculate donation totals from the complete dataset
      if (donationData.data) {
        const donationTotals = donationData.data.reduce((totals, donation) => {
          totals[donation.fundraiser_id] = 
            (totals[donation.fundraiser_id] || 0) + Number(donation.amount);
          return totals;
        }, {} as Record<string, number>);
        
        setDonations(donationTotals);
      }

      if (isLoadMore) {
        setOffset(currentOffset + limit);
      } else {
        setOffset(limit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options, offset, limit]);

  const loadMore = useCallback(() => loadFundraisers(true), [loadFundraisers]);

  const refresh = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    setDonations({}); // Clear donations to prevent stale data
    return loadFundraisers(false);
  }, [loadFundraisers]);

  useEffect(() => {
    loadFundraisers(false);
    
    // Set up real-time subscription for donations to keep data in sync
    const channel = supabase
      .channel('fundraiser-donations-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations'
        },
        () => {
          // Refresh donation data when new donations are made
          setTimeout(() => {
            loadFundraisers(false);
          }, 1000);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.category, options.searchTerm]);

  return {
    fundraisers,
    donations,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}