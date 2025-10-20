/**
 * Categories hook with unified data management
 */
import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '@/lib/services/category.service';
import type { Category, CategoryStats } from '@/types';

interface UseCategoriesState {
  categories: Category[];
  stats: CategoryStats[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesActions {
  refresh: () => Promise<void>;
  getCategoryByName: (name: string) => Category | null;
}

interface UseCategoriesReturn extends UseCategoriesState, UseCategoriesActions {}

export function useCategories(): UseCategoriesReturn {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    stats: [],
    loading: true,
    error: null,
  });

  const loadCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [categories, stats] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getCategoryStats(),
      ]);

      setState({
        categories,
        stats,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error loading categories:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load categories',
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    categoryService.clearCache();
    await loadCategories();
  }, [loadCategories]);

  const getCategoryByName = useCallback((name: string): Category | null => {
    return state.categories.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }, [state.categories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    ...state,
    refresh,
    getCategoryByName,
  };
}