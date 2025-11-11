/**
 * Fundraiser hook with unified data management
 * Now using optimized query patterns for better performance
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fundraiserService, type FundraiserQueryOptions } from '@/lib/services/fundraiser.service';
import { useOptimizedQuery } from '@/lib/api/optimized-queries';
import type { Fundraiser } from '@/types';
import { logger } from '@/lib/services/logger.service';

interface UseFundraisersState {
  fundraisers: Fundraiser[];
  stats: Record<string, any>;
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
    hasMore: false,
    total: 0,
  });

  const [offset, setOffset] = useState(0);
  const limit = options.limit || 12;

  const loadFundraisers = useCallback(async (isLoadMore = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const currentOffset = isLoadMore ? offset : 0;
      const result = await fundraiserService.getFundraisers({
        ...options,
        offset: currentOffset,
        limit,
      });

      const fundraiserIds = result.data.map(f => f.id);
      const stats = fundraiserIds.length > 0 
        ? await fundraiserService.getFundraiserStats(fundraiserIds)
        : {};

      setState(prev => ({
        fundraisers: isLoadMore ? [...prev.fundraisers, ...result.data] : result.data,
        stats: isLoadMore ? { ...prev.stats, ...stats } : stats,
        loading: false,
        error: null,
        hasMore: result.hasMore,
        total: result.total || 0,
      }));

      if (!isLoadMore) {
        setOffset(limit);
      }

    } catch (error) {
      logger.error('Error loading fundraisers', error as Error, {
        componentName: 'useFundraisers',
        operationName: 'loadFundraisers',
        metadata: { options, offset }
      });
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load fundraisers',
      }));
    }
  }, [options, offset, limit]);

  const loadMore = useCallback(async () => {
    if (!state.loading && state.hasMore) {
      setOffset(prev => prev + limit);
      await loadFundraisers(true);
    }
  }, [state.loading, state.hasMore, limit, loadFundraisers]);

  const refresh = useCallback(async () => {
    fundraiserService.clearCache();
    setOffset(0);
    setState(prev => ({ ...prev, fundraisers: [], stats: {} }));
    await loadFundraisers(false);
  }, [loadFundraisers]);

  const retry = useCallback(async () => {
    await loadFundraisers(false);
  }, [loadFundraisers]);

  useEffect(() => {
    loadFundraisers(false);
  }, [options.category, options.searchTerm, options.status, options.visibility]);

  return {
    ...state,
    loadMore,
    refresh,
    retry,
  };
}