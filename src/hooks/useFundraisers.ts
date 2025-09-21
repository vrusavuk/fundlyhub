/**
 * Custom hook for managing fundraiser data fetching and state
 */
import { useState, useEffect, useCallback } from 'react';
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

      // Fetch donation totals
      const fundraiserIds = data.map(f => f.id);
      if (fundraiserIds.length > 0) {
        const donationTotals = await fetchDonationTotals(fundraiserIds);
        setDonations(prev => ({ ...prev, ...donationTotals }));
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
  }, [options, offset, limit, fundraisers]);

  const loadMore = useCallback(() => loadFundraisers(true), [loadFundraisers]);

  const refresh = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    return loadFundraisers(false);
  }, [loadFundraisers]);

  useEffect(() => {
    loadFundraisers(false);
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