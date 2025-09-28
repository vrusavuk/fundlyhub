/**
 * Enterprise category service with unified data management
 */
import { supabase } from '@/integrations/supabase/client';
import { apiService, ApiError } from './api.service';
import type { Category, CategoryStats } from '@/types';

class CategoryService {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes for categories (less frequent changes)

  /**
   * Fetch all active categories
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories:active';

    return apiService.executeWithCache(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) {
          throw new ApiError(
            `Failed to fetch categories: ${error.message}`,
            error.code,
            undefined,
            true
          );
        }

        return data || [];
      },
      { key: cacheKey, ttl: this.CACHE_TTL }
    );
  }

  /**
   * Fetch category statistics with proper aggregation
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const cacheKey = 'category-stats:all';

    return apiService.executeWithCache(
      async () => {
        const { data, error } = await supabase.rpc('get_category_stats');

        if (error) {
          throw new ApiError(
            `Failed to fetch category statistics: ${error.message}`,
            error.code,
            undefined,
            true
          );
        }

        return data || [];
      },
      { key: cacheKey, ttl: this.CACHE_TTL / 2 } // Shorter cache for stats
    );
  }

  /**
   * Get category by name
   */
  async getCategoryByName(name: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Clear category-related cache
   */
  clearCache(pattern?: string): void {
    apiService.clearCache(pattern || 'categor*');
  }
}

export const categoryService = new CategoryService();