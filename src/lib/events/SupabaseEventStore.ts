/**
 * Supabase-backed Event Store
 * Provides persistent event storage with real-time streaming capabilities
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { EventStore, DomainEvent } from './types';
import { logger } from '@/lib/services/logger.service';

export class SupabaseEventStore implements EventStore {
  private supabase: SupabaseClient;
  private batchQueue: DomainEvent[] = [];
  private batchSize: number;
  private flushInterval: NodeJS.Timeout | null = null;
  private flushMs: number;

  constructor(
    supabase: SupabaseClient,
    batchSize = 50,
    flushMs = 1000
  ) {
    this.supabase = supabase;
    this.batchSize = batchSize;
    this.flushMs = flushMs;
    this.startBatchFlushing();
  }

  private startBatchFlushing(): void {
    this.flushInterval = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.flushBatch().catch((error) => {
          logger.error('Batch flush error in interval', error as Error, {
            componentName: 'SupabaseEventStore',
            operationName: 'startBatchFlushing',
          });
        });
      }
    }, this.flushMs);
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await this.saveBatch(batch);
    } catch (error) {
      // Re-queue failed events at the front
      this.batchQueue.unshift(...batch);
      logger.error('Batch flush failed, events re-queued', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'flushBatch',
        metadata: { batchSize: batch.length },
      });
      throw error;
    }
  }

  async save<T extends DomainEvent>(event: T): Promise<void> {
    const { error } = await this.supabase
      .from('event_store')
      .insert({
        event_id: event.id,
        event_type: event.type,
        event_data: event.payload,
        event_version: event.version,
        occurred_at: new Date(event.timestamp).toISOString(),
        correlation_id: event.correlationId,
        causation_id: event.causationId,
        aggregate_id: this.extractAggregateId(event),
        metadata: event.metadata || {}
      });

    if (error) {
      logger.error('Failed to save event', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'save',
        metadata: { eventType: event.type, eventId: event.id },
      });
      throw new Error(`Failed to save event: ${error.message}`);
    }
  }

  async saveBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    if (events.length === 0) return;

    const records = events.map(event => ({
      event_id: event.id,
      event_type: event.type,
      event_data: event.payload,
      event_version: event.version,
      occurred_at: new Date(event.timestamp).toISOString(),
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      aggregate_id: this.extractAggregateId(event),
      metadata: event.metadata || {}
    }));

    const { error } = await this.supabase
      .from('event_store')
      .insert(records);

    if (error) {
      logger.error('Failed to save event batch', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'saveBatch',
        metadata: { batchSize: events.length },
      });
      throw new Error(`Failed to save event batch: ${error.message}`);
    }
  }

  async getEvents(fromTimestamp?: number): Promise<DomainEvent[]> {
    let query = this.supabase
      .from('event_store')
      .select('*')
      .order('occurred_at', { ascending: true });

    if (fromTimestamp) {
      query = query.gte('occurred_at', new Date(fromTimestamp).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get events', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'getEvents',
        metadata: { fromTimestamp },
      });
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const { data, error } = await this.supabase
      .from('event_store')
      .select('*')
      .eq('event_type', eventType)
      .order('occurred_at', { ascending: true });

    if (error) {
      logger.error('Failed to get events by type', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'getEventsByType',
        metadata: { eventType },
      });
      throw new Error(`Failed to get events by type: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  async getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]> {
    const { data, error } = await this.supabase
      .from('event_store')
      .select('*')
      .eq('correlation_id', correlationId)
      .order('occurred_at', { ascending: true });

    if (error) {
      logger.error('Failed to get events by correlation', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'getEventsByCorrelation',
        metadata: { correlationId },
      });
      throw new Error(`Failed to get events by correlation: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  async getEventsByAggregate(aggregateId: string): Promise<DomainEvent[]> {
    const { data, error } = await this.supabase
      .from('event_store')
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('occurred_at', { ascending: true });

    if (error) {
      logger.error('Failed to get events by aggregate', error as Error, {
        componentName: 'SupabaseEventStore',
        operationName: 'getEventsByAggregate',
        metadata: { aggregateId },
      });
      throw new Error(`Failed to get events by aggregate: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  /**
   * Stream events in real-time using Supabase Realtime
   */
  streamEvents(callback: (event: DomainEvent) => void): () => void {
    const channel = this.supabase
      .channel('event-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_store' },
        (payload) => {
          try {
            const event = this.mapToDomainEvent(payload.new);
            callback(event);
          } catch (error) {
            logger.error('Error processing streamed event', error as Error, {
              componentName: 'SupabaseEventStore',
              operationName: 'streamEvents',
            });
          }
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  private extractAggregateId(event: DomainEvent): string | null {
    const payload = event.payload as any;

    // Extract aggregate ID based on event type and payload
    if (payload.userId) return payload.userId;
    if (payload.campaignId) return payload.campaignId;
    if (payload.donationId) return payload.donationId;
    if (payload.organizationId) return payload.organizationId;

    return null;
  }

  private mapToDomainEvent(record: any): DomainEvent {
    return {
      id: record.event_id,
      type: record.event_type,
      payload: record.event_data,
      timestamp: new Date(record.occurred_at).getTime(),
      version: record.event_version,
      correlationId: record.correlation_id,
      causationId: record.causation_id,
      metadata: record.metadata
    };
  }

  /**
   * Cleanup method to stop batch flushing
   */
  disconnect(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush any remaining events
    if (this.batchQueue.length > 0) {
      this.flushBatch().catch((error) => {
        logger.error('Batch flush error during disconnect', error as Error, {
          componentName: 'SupabaseEventStore',
          operationName: 'disconnect',
        });
      });
    }
  }
}
