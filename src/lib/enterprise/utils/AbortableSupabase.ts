/**
 * Supabase wrapper with AbortSignal support for end-to-end abortable operations
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export class AbortableSupabase {
  private client: SupabaseClient;
  private currentSignal?: AbortSignal;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Create a new instance with the provided signal
   */
  withSignal(signal?: AbortSignal): AbortableSupabase {
    const instance = new AbortableSupabase(this.client);
    instance.currentSignal = signal;
    return instance;
  }

  /**
   * Create abortable query builder
   */
  from(table: string) {
    return new AbortableQueryBuilder(this.client, table, this.currentSignal);
  }

  /**
   * Auth operations with abort support
   */
  get auth() {
    return {
      getUser: async (signal?: AbortSignal) => {
        const controller = new AbortController();
        if (signal) {
          signal.addEventListener('abort', () => controller.abort());
        }

        // Wrap the promise to make it abortable
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            controller.abort();
            reject(new Error('Auth request timed out'));
          }, 10000);

          controller.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Auth request aborted'));
          });

          this.client.auth.getUser().then(result => {
            clearTimeout(timeout);
            resolve(result);
          }).catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      }
    };
  }
}

export class AbortableQueryBuilder {
  private client: SupabaseClient;
  private table: string;
  private queryChain: any;
  private signal?: AbortSignal;

  constructor(client: SupabaseClient, table: string, signal?: AbortSignal) {
    this.client = client;
    this.table = table;
    this.queryChain = client.from(table);
    this.signal = signal;
  }

  select(columns?: string) {
    this.queryChain = this.queryChain.select(columns);
    return this;
  }

  insert(data: any) {
    this.queryChain = this.queryChain.insert(data);
    return this;
  }

  update(data: any) {
    this.queryChain = this.queryChain.update(data);
    return this;
  }

  delete() {
    this.queryChain = this.queryChain.delete();
    return this;
  }

  eq(column: string, value: any) {
    this.queryChain = this.queryChain.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.queryChain = this.queryChain.neq(column, value);
    return this;
  }

  or(filters: string) {
    this.queryChain = this.queryChain.or(filters);
    return this;
  }

  textSearch(column: string, query: string, options?: { type?: string }) {
    this.queryChain = this.queryChain.textSearch(column, query, options);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.queryChain = this.queryChain.order(column, options);
    return this;
  }

  limit(count: number) {
    this.queryChain = this.queryChain.limit(count);
    return this;
  }

  range(from: number, to: number) {
    this.queryChain = this.queryChain.range(from, to);
    return this;
  }

  single() {
    this.queryChain = this.queryChain.single();
    return this;
  }

  /**
   * Execute query with abort signal support
   */
  async execute(signal?: AbortSignal): Promise<any> {
    const effectiveSignal = signal || this.signal;
    
    return new Promise((resolve, reject) => {
      let completed = false;

      // Set up abort handling
      const abortHandler = () => {
        if (!completed) {
          completed = true;
          reject(new Error('Query aborted'));
        }
      };

      if (effectiveSignal) {
        if (effectiveSignal.aborted) {
          reject(new Error('Query aborted'));
          return;
        }
        effectiveSignal.addEventListener('abort', abortHandler);
      }

      // Execute the query
      this.queryChain
        .then((result: any) => {
          if (!completed) {
            completed = true;
            if (effectiveSignal) {
              effectiveSignal.removeEventListener('abort', abortHandler);
            }
            resolve(result);
          }
        })
        .catch((error: any) => {
          if (!completed) {
            completed = true;
            if (effectiveSignal) {
              effectiveSignal.removeEventListener('abort', abortHandler);
            }
            reject(error);
          }
        });
    });
  }

  /**
   * Legacy method for backward compatibility
   */
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected?: any) {
    return this.execute().catch(onRejected);
  }
}

export const abortableSupabase = new AbortableSupabase();