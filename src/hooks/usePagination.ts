/**
 * Unified Pagination Hook
 * Manages pagination state with URL sync and state preservation
 * Follows Open/Closed Principle - extensible pagination strategies
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationControls {
  state: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  reset: () => void;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  syncWithURL?: boolean;
  onPageChange?: (page: number) => void;
}

export function usePagination(options: UsePaginationOptions = {}): PaginationControls {
  const {
    initialPage = 1,
    initialPageSize = 20,
    syncWithURL = false,
    onPageChange
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL if sync is enabled
  const getInitialPage = () => {
    if (syncWithURL) {
      const urlPage = searchParams.get('page');
      return urlPage ? parseInt(urlPage, 10) : initialPage;
    }
    return initialPage;
  };

  const getInitialPageSize = () => {
    if (syncWithURL) {
      const urlPageSize = searchParams.get('pageSize');
      return urlPageSize ? parseInt(urlPageSize, 10) : initialPageSize;
    }
    return initialPageSize;
  };

  const [state, setState] = useState<PaginationState>({
    page: getInitialPage(),
    pageSize: getInitialPageSize(),
    total: 0,
    totalPages: 0
  });

  // Sync state to URL
  useEffect(() => {
    if (syncWithURL) {
      const params = new URLSearchParams(searchParams);
      params.set('page', state.page.toString());
      params.set('pageSize', state.pageSize.toString());
      setSearchParams(params, { replace: true });
    }
  }, [state.page, state.pageSize, syncWithURL]);

  const goToPage = useCallback((page: number) => {
    setState(prev => {
      const newPage = Math.max(1, Math.min(page, prev.totalPages || 1));
      if (newPage !== prev.page) {
        onPageChange?.(newPage);
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [onPageChange]);

  const nextPage = useCallback(() => {
    setState(prev => {
      if (prev.page < prev.totalPages) {
        const newPage = prev.page + 1;
        onPageChange?.(newPage);
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [onPageChange]);

  const prevPage = useCallback(() => {
    setState(prev => {
      if (prev.page > 1) {
        const newPage = prev.page - 1;
        onPageChange?.(newPage);
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [onPageChange]);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => {
      const newTotalPages = Math.ceil(prev.total / pageSize);
      const newPage = Math.min(prev.page, newTotalPages || 1);
      
      onPageChange?.(newPage);
      
      return {
        ...prev,
        pageSize,
        page: newPage,
        totalPages: newTotalPages
      };
    });
  }, [onPageChange]);

  const setTotal = useCallback((total: number) => {
    setState(prev => {
      const totalPages = Math.ceil(total / prev.pageSize);
      const page = Math.min(prev.page, totalPages || 1);
      
      return {
        ...prev,
        total,
        totalPages,
        page
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      page: initialPage,
      pageSize: initialPageSize,
      total: 0,
      totalPages: 0
    });
    onPageChange?.(initialPage);
  }, [initialPage, initialPageSize, onPageChange]);

  return {
    state,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setTotal,
    reset
  };
}
