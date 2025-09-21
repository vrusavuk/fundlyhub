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
      const data = await fetchFundraisers({
        ...options,
        offset: currentOffset,
        limit
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      const newFundraisers = isLoadMore ? [...fundraisers, ...data] : data;
      setFundraisers(newFundraisers as Fundraiser[]);

      // Fetch donation totals for the fundraisers we just loaded
      const fundraiserIds = data.map(f => f.id);
      if (fundraiserIds.length > 0) {
        const donationTotals = await fetchDonationTotals(fundraiserIds);
        if (isLoadMore) {
          // Merge with existing donations
          setDonations(prev => ({ ...prev, ...donationTotals }));
        } else {
          // Replace all donations
          setDonations(donationTotals);
        }
      }

      if (isLoadMore) {
        setOffset(currentOffset + limit);
      } else {
        setOffset(limit);
      }
    } catch (err) {
      console.error('Error loading fundraisers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options, offset, limit, fundraisers]);

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
        (payload) => {
          console.log('New donation detected, updating fundraiser data');
          // Refresh donation data for the affected fundraiser
          const newDonation = payload.new as any;
          if (newDonation?.fundraiser_id) {
            fetchDonationTotals([newDonation.fundraiser_id]).then(totals => {
              setDonations(prev => ({ ...prev, ...totals }));
            });
          }
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