/**
 * Service Event Publisher Decorator
 * Following Decorator Pattern and Dependency Inversion Principle
 */

import { EventPublisher, DomainEvent } from '../types';

/**
 * Decorator that adds event publishing capabilities to services
 * Following Open/Closed and Single Responsibility principles
 */
export class ServiceEventPublisher {
  constructor(private eventPublisher: EventPublisher) {}

  /**
   * Creates a decorated service that publishes events
   * Following Decorator pattern
   */
  decorate<T extends object>(service: T): T & { publishEvent: <E extends DomainEvent>(event: E) => Promise<void> } {
    return new Proxy(service, {
      get: (target, prop) => {
        if (prop === 'publishEvent') {
          return async <E extends DomainEvent>(event: E) => {
            await this.eventPublisher.publish(event);
          };
        }
        return (target as any)[prop];
      }
    }) as T & { publishEvent: <E extends DomainEvent>(event: E) => Promise<void> };
  }

  /**
   * Publishes an event with correlation tracking
   */
  async publishWithCorrelation<T extends DomainEvent>(
    event: T,
    correlationId: string
  ): Promise<void> {
    const correlatedEvent = {
      ...event,
      correlationId,
    };
    await this.eventPublisher.publish(correlatedEvent);
  }

  /**
   * Publishes multiple related events as a batch
   */
  async publishBatch<T extends DomainEvent>(
    events: T[],
    correlationId?: string
  ): Promise<void> {
    const correlatedEvents = correlationId
      ? events.map(event => ({ ...event, correlationId }))
      : events;
    
    await this.eventPublisher.publishBatch(correlatedEvents);
  }
}

/**
 * Event publishing mixin for services
 * Following Mixin pattern for composition over inheritance
 */
export function withEventPublishing<T extends new (...args: any[]) => any>(
  BaseClass: T,
  eventPublisher: EventPublisher
) {
  return class extends BaseClass {
    protected async publishEvent<E extends DomainEvent>(event: E): Promise<void> {
      await eventPublisher.publish(event);
    }

    protected async publishEvents<E extends DomainEvent>(
      events: E[],
      correlationId?: string
    ): Promise<void> {
      const correlatedEvents = correlationId
        ? events.map(event => ({ ...event, correlationId }))
        : events;
      
      await eventPublisher.publishBatch(correlatedEvents);
    }

    protected generateCorrelationId(): string {
      return crypto.randomUUID();
    }
  };
}