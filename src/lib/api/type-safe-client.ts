import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/utils';

/**
 * Type-safe Supabase client wrapper
 * Provides simpler API with better error handling and full type safety
 */
export class TypeSafeSupabaseClient {
  /**
   * Query data from a table with type safety
   */
  async query<
    TableName extends keyof Database['public']['Tables'],
    Row = Database['public']['Tables'][TableName]['Row']
  >(
    table: TableName,
    options?: {
      select?: string;
      filter?: Record<string, unknown>;
      limit?: number;
    }
  ): Promise<Result<Row[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        .from(table)
        .select(options?.select || '*') as any;

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: (data || []) as Row[] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  /**
   * Insert data into a table
   */
  async insert<
    TableName extends keyof Database['public']['Tables'],
    Insert = Database['public']['Tables'][TableName]['Insert'],
    Row = Database['public']['Tables'][TableName]['Row']
  >(
    table: TableName,
    data: Insert
  ): Promise<Result<Row>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: inserted as Row };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  /**
   * Update data in a table
   */
  async update<
    TableName extends keyof Database['public']['Tables'],
    Update = Database['public']['Tables'][TableName]['Update'],
    Row = Database['public']['Tables'][TableName]['Row']
  >(
    table: TableName,
    id: string,
    data: Update
  ): Promise<Result<Row>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await supabase
        .from(table)
        .update(data as any)
        .eq('id' as any, id)
        .select()
        .single();

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: updated as Row };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
}

export const typeSafeDb = new TypeSafeSupabaseClient();
