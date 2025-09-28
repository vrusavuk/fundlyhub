/**
 * Event Store Implementation - In-Memory for now
 * Following Single Responsibility Principle
 */

import { EventStore, DomainEvent } from './types';

export class InMemoryEventStore implements EventStore {
  private events: DomainEvent[] = [];

  async save<T extends DomainEvent>(event: T): Promise<void> {
    this.events.push(event);
  }

  async saveBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    this.events.push(...events);
  }

  async getEvents(fromTimestamp?: number): Promise<DomainEvent[]> {
    if (!fromTimestamp) {
      return [...this.events].sort((a, b) => a.timestamp - b.timestamp);
    }
    
    return this.events
      .filter(event => event.timestamp >= fromTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    return this.events
      .filter(event => event.type === eventType)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]> {
    return this.events
      .filter(event => event.correlationId === correlationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async getEventsByAggregate(aggregateId: string): Promise<DomainEvent[]> {
    return this.events
      .filter(event => this.extractAggregateId(event) === aggregateId)
      .sort((a, b) => a.timestamp - b.timestamp);
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

  // Additional methods for debugging and testing
  public clear(): void {
    this.events = [];
  }

  public getAllEvents(): DomainEvent[] {
    return [...this.events];
  }

  public getEventCount(): number {
    return this.events.length;
  }
}