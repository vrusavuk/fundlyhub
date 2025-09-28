/**
 * Event Store Implementation using Supabase
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';
import { EventStore, DomainEvent } from './types';

export class SupabaseEventStore implements EventStore {
  private readonly tableName = 'event_store';

  async save<T extends DomainEvent>(event: T): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .insert({
        event_id: event.id,
        event_type: event.type,
        event_version: event.version,
        aggregate_id: this.extractAggregateId(event),
        correlation_id: event.correlationId,
        causation_id: event.causationId,
        event_data: event.payload,
        metadata: event.metadata || {},
        occurred_at: new Date(event.timestamp).toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save event: ${error.message}`);
    }
  }

  async saveBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    if (events.length === 0) return;

    const eventRows = events.map(event => ({
      event_id: event.id,
      event_type: event.type,
      event_version: event.version,
      aggregate_id: this.extractAggregateId(event),
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      event_data: event.payload,
      metadata: event.metadata || {},
      occurred_at: new Date(event.timestamp).toISOString(),
    }));

    const { error } = await supabase
      .from(this.tableName)
      .insert(eventRows);

    if (error) {
      throw new Error(`Failed to save events batch: ${error.message}`);
    }
  }

  async getEvents(fromTimestamp?: number): Promise<DomainEvent[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .order('occurred_at', { ascending: true });

    if (fromTimestamp) {
      query = query.gte('occurred_at', new Date(fromTimestamp).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return (data || []).map(this.mapRowToEvent);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('event_type', eventType)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get events by type: ${error.message}`);
    }

    return (data || []).map(this.mapRowToEvent);
  }

  async getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('correlation_id', correlationId)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get events by correlation: ${error.message}`);
    }

    return (data || []).map(this.mapRowToEvent);
  }

  async getEventsByAggregate(aggregateId: string): Promise<DomainEvent[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get events by aggregate: ${error.message}`);
    }

    return (data || []).map(this.mapRowToEvent);
  }

  private extractAggregateId(event: DomainEvent): string | null {
    // Extract aggregate ID based on event type and payload
    const payload = event.payload as any;
    
    if (payload.userId) return payload.userId;
    if (payload.campaignId) return payload.campaignId;
    if (payload.donationId) return payload.donationId;
    if (payload.organizationId) return payload.organizationId;
    
    return null;
  }

  private mapRowToEvent(row: any): DomainEvent {
    return {
      id: row.event_id,
      type: row.event_type,
      version: row.event_version,
      timestamp: new Date(row.occurred_at).getTime(),
      correlationId: row.correlation_id,
      causationId: row.causation_id,
      metadata: row.metadata,
      payload: row.event_data,
    };
  }
}