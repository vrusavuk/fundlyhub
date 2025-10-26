import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/utils';

/**
 * Type-safe Supabase client wrapper
 * Provides simpler API with better error handling
 */
export class TypeSafeSupabaseClient {
  async query<TableName extends keyof Database['public']['Tables']>(
    table: TableName,
    options?: {
      select?: string;
      limit?: number;
    }
  ): Promise<Result<any[]>> {
    try {
      let query = supabase.from(table).select(options?.select || '*');

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async insert<TableName extends keyof Database['public']['Tables']>(
    table: TableName,
    data: any
  ): Promise<Result<any>> {
    try {
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: inserted };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async update<TableName extends keyof Database['public']['Tables']>(
    table: TableName,
    id: string,
    data: any
  ): Promise<Result<any>> {
    try {
      const { data: updated, error } = await supabase
        .from(table)
        .update(data)
        .eq('id' as any, id)
        .select()
        .single();

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export const typeSafeDb = new TypeSafeSupabaseClient();
