/**
 * Enterprise-level fundraiser hook with proper state management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fundraiserService, type FundraiserQueryOptions, type FundraiserStats } from '@/lib/services/fundraiser.service';
import type { Fundraiser } from '@/types/fundraiser';

interface UseFundraisersState {
  fundraisers: Fundraiser[];
  stats: Record<string, FundraiserStats>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
}

interface UseFundraisersActions {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

interface UseFundraisersReturn extends UseFundraisersState, UseFundraisersActions {}

export function useFundraisers(options: FundraiserQueryOptions = {}): UseFundraisersReturn {
  const [state, setState] = useState<UseFundraisersState>({
    fundraisers: [],
    stats: {},
    loading: true,
    error: null,
    hasMore: true,
    total: 0,
  });

  const [offset, setOffset] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const limit = options.limit || 12;

  const loadFundraisers = useCallback(async (isLoadMore = false) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        loading: !isLoadMore || prev.fundraisers.length === 0,
        error: null,
      }));

      const currentOffset = isLoadMore ? offset : 0;
      const result = await fundraiserService.getFundraisers({
        ...options,
        offset: currentOffset,
        limit,
      });

      // Get stats for the new fundraisers
      const fundraiserIds = result.data.map(f => f.id);
      const stats = fundraiserIds.length > 0 
        ? await fundraiserService.getFundraiserStats(fundraiserIds)
        : {};

      setState(prev => ({
        ...prev,
        fundraisers: isLoadMore ? [...prev.fundraisers, ...result.data] : result.data,
        stats: isLoadMore ? { ...prev.stats, ...stats } : stats,
        loading: false,
        error: null,
        hasMore: result.hasMore,
        total: result.total || 0,
      }));

      if (isLoadMore) {
        setOffset(currentOffset + limit);
      } else {
        setOffset(limit);
      }

    } catch (error) {
      console.error('Error loading fundraisers:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load fundraisers',
      }));
    }
  }, [options, offset, limit]);

  const loadMore = useCallback(() => loadFundraisers(true), [loadFundraisers]);

  const refresh = useCallback(async () => {
    fundraiserService.clearCache();
    setOffset(0);
    setState(prev => ({
      ...prev,
      hasMore: true,
      total: 0,
    }));
    await loadFundraisers(false);
  }, [loadFundraisers]);

  const retry = useCallback(() => loadFundraisers(false), [loadFundraisers]);

  // Load initial data
  useEffect(() => {
    loadFundraisers(false);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [options.category, options.searchTerm, options.status, options.visibility]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    loadMore,
    refresh,
    retry,
  };
}