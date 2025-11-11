/**
 * Event Bus Implementation
 * Following Single Responsibility and Open/Closed Principles
 */

import { 
  DomainEvent, 
  EventHandler, 
  EventBus as IEventBus, 
  EventBusConfig,
  EventMiddleware,
  EventStore
} from './types';
import { logger } from '@/lib/services/logger.service';

export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private middleware: EventMiddleware[] = [];
  private eventStore?: EventStore;
  private connected = false;

  constructor(
    private config: EventBusConfig = {},
    eventStore?: EventStore
  ) {
    this.middleware = config.middleware || [];
    this.eventStore = eventStore;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.handlers.clear();
    this.connected = false;
  }

  // Publisher implementation (Dependency Inversion)
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.connected) {
      throw new Error('EventBus is not connected');
    }

    try {
      // Apply before middleware
      let processedEvent = event;
      for (const middleware of this.middleware) {
        if (middleware.beforePublish) {
          processedEvent = await middleware.beforePublish(processedEvent);
        }
      }

      // Persist event if enabled
      if (this.config.enablePersistence && this.eventStore) {
        await this.eventStore.save(processedEvent);
      }

      // Dispatch to handlers
      await this.dispatchEvent(processedEvent);

      // Apply after middleware
      for (const middleware of this.middleware) {
        if (middleware.afterPublish) {
          await middleware.afterPublish(processedEvent);
        }
      }
    } catch (error) {
      await this.handleError(error as Error, event);
      throw error;
    }
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    if (!this.connected) {
      throw new Error('EventBus is not connected');
    }

    const batchSize = this.config.batchSize || 10;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Promise.all(batch.map(event => this.publish(event)));
    }
  }

  // Subscriber implementation (Interface Segregation)
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, handler as EventHandler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  unsubscribeAll(): void {
    this.handlers.clear();
  }

  // Event replay capability
  async replay(fromTimestamp?: number): Promise<void> {
    if (!this.config.enableReplay || !this.eventStore) {
      throw new Error('Event replay is not enabled');
    }

    const events = await this.eventStore.getEvents(fromTimestamp);
    for (const event of events) {
      await this.dispatchEvent(event);
    }
  }

  // Private methods
  private async dispatchEvent<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler.handle(event);
      } catch (error) {
        logger.error(`Handler failed for event ${event.type}`, error as Error, {
          componentName: 'EventBus',
          operationName: 'dispatchEvent',
          metadata: { eventType: event.type, eventId: event.id },
        });
        await this.handleError(error as Error, event);
      }
    });

    await Promise.allSettled(promises);
  }

  private async handleError(error: Error, event: DomainEvent): Promise<void> {
    for (const middleware of this.middleware) {
      if (middleware.onError) {
        try {
          await middleware.onError(error, event);
        } catch (middlewareError) {
          logger.error('Middleware error handler failed', middlewareError as Error, {
            componentName: 'EventBus',
            operationName: 'handleError',
            metadata: { eventType: event.type, eventId: event.id },
          });
        }
      }
    }
  }
}