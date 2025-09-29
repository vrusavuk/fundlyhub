/**
 * Dead Letter Queue Manager
 * Handles reprocessing of failed events
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ReprocessResult {
  success: number;
  failed: number;
  errors: string[];
}

export class DeadLetterQueueManager {
  constructor(private supabase: SupabaseClient) {}
  
  /**
   * Reprocess a single event from the DLQ
   */
  async reprocessEvent(dlqId: string): Promise<boolean> {
    try {
      // Get event from DLQ
      const { data: dlqItem, error } = await this.supabase
        .from('event_dead_letter_queue')
        .select('*')
        .eq('id', dlqId)
        .single();
      
      if (error || !dlqItem) {
        console.error('Failed to get DLQ item:', error);
        return false;
      }
      
      // Call event processor
      const { error: processError } = await this.supabase.functions.invoke('event-processor', {
        body: { events: [dlqItem.event_data] }
      });
      
      if (!processError) {
        // Remove from DLQ on success
        await this.supabase
          .from('event_dead_letter_queue')
          .delete()
          .eq('id', dlqId);
        
        console.log(`Successfully reprocessed event ${dlqId}`);
        return true;
      }
      
      // Increment failure count
      await this.supabase
        .from('event_dead_letter_queue')
        .update({
          failure_count: dlqItem.failure_count + 1,
          last_failed_at: new Date().toISOString(),
        })
        .eq('id', dlqId);
      
      console.error(`Reprocessing failed for event ${dlqId}:`, processError);
      return false;
    } catch (error) {
      console.error('Reprocessing failed:', error);
      return false;
    }
  }
  
  /**
   * Reprocess all events in the DLQ, optionally filtered by processor
   */
  async reprocessAll(processorName?: string): Promise<ReprocessResult> {
    let query = this.supabase
      .from('event_dead_letter_queue')
      .select('id');
    
    if (processorName) {
      query = query.eq('processor_name', processorName);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch DLQ items: ${error.message}`);
    }
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const item of data || []) {
      const result = await this.reprocessEvent(item.id);
      if (result) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to reprocess ${item.id}`);
      }
    }
    
    return { success, failed, errors };
  }
  
  /**
   * Get DLQ items with optional filtering
   */
  async getItems(options?: {
    processorName?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.supabase
      .from('event_dead_letter_queue')
      .select('*', { count: 'exact' })
      .order('first_failed_at', { ascending: false });
    
    if (options?.processorName) {
      query = query.eq('processor_name', options.processorName);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }
    
    return query;
  }
  
  /**
   * Delete an event from the DLQ
   */
  async deleteItem(dlqId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('event_dead_letter_queue')
      .delete()
      .eq('id', dlqId);
    
    if (error) {
      console.error('Failed to delete DLQ item:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get DLQ statistics
   */
  async getStats() {
    const { data, error } = await this.supabase
      .from('event_dead_letter_queue')
      .select('processor_name, failure_count');
    
    if (error) {
      console.error('Failed to get DLQ stats:', error);
      return null;
    }
    
    const stats = {
      total: data?.length || 0,
      byProcessor: {} as Record<string, number>,
      totalFailures: 0,
    };
    
    for (const item of data || []) {
      stats.byProcessor[item.processor_name] = 
        (stats.byProcessor[item.processor_name] || 0) + 1;
      stats.totalFailures += item.failure_count;
    }
    
    return stats;
  }
}
