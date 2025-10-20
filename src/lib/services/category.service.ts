/**
 * Category Service - Thin wrapper around unified API
 * Domain-specific logic for category operations
 */
import { supabase } from '@/integrations/supabase/client';
import { unifiedApi } from './unified-api.service';
import type { Category, CategoryStats } from '@/types';

class CategoryService {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Fetch all active categories
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories:all';

    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        return { data: data as Category[], error };
      },
      { cache: { key: cacheKey, ttl: this.CACHE_TTL, tags: ['categories'] } }
    );
  }

  /**
   * Fetch category by name
   */
  async getCategoryByName(name: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Fetch category statistics
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const cacheKey = 'categories:stats';

    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase.rpc('get_category_stats');
        return { data: data as CategoryStats[], error };
      },
      { cache: { key: cacheKey, ttl: this.CACHE_TTL / 2, tags: ['category-stats'] } }
    );
  }

  /**
   * Clear category cache
   */
  clearCache(pattern?: string): void {
    unifiedApi.clearCache(pattern || 'categories*');
  }
}

export const categoryService = new CategoryService();