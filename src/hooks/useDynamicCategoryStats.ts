/**
 * Enterprise category stats hook
 * Uses the new service layer for better performance and caching
 */
import { useCategories } from './useCategories';

// Re-export the stats from the main categories hook for backward compatibility
export function useDynamicCategoryStats() {
  const { stats: categoryStats, loading, error, refresh } = useCategories();
  
  return {
    stats: categoryStats,
    loading,
    error,
    refetch: refresh,
  };
}