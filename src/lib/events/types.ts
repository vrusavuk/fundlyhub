/**
 * Core Event System Types
 * Following Interface Segregation Principle
 */

// Base event interface
export interface BaseEvent {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly version: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Record<string, any>;
}

// Event payload constraint
export interface EventPayload {
  readonly [key: string]: any;
}

// Typed event interface
export interface DomainEvent<T extends EventPayload = EventPayload> extends BaseEvent {
  readonly payload: T;
}

// Event handler interface (Single Responsibility)
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  readonly eventType: string;
  handle(event: T): Promise<void> | void;
}

// Event publisher interface (Dependency Inversion)
export interface EventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishBatch<T extends DomainEvent>(events: T[]): Promise<void>;
}

// Event subscriber interface (Interface Segregation)
export interface EventSubscriber {
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void;
  unsubscribe(eventType: string, handler: EventHandler): void;
  unsubscribeAll(): void;
}

// Event bus interface (Single Responsibility)
export interface EventBus extends EventPublisher, EventSubscriber {
  readonly isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  replay(fromTimestamp?: number): Promise<void>;
}

// Event middleware interface (Open/Closed)
export interface EventMiddleware {
  beforePublish?<T extends DomainEvent>(event: T): Promise<T> | T;
  afterPublish?<T extends DomainEvent>(event: T): Promise<void> | void;
  onError?(error: Error, event: DomainEvent): Promise<void> | void;
}

// Event store interface (Single Responsibility)
export interface EventStore {
  save<T extends DomainEvent>(event: T): Promise<void>;
  saveBatch<T extends DomainEvent>(events: T[]): Promise<void>;
  getEvents(fromTimestamp?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string): Promise<DomainEvent[]>;
  getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]>;
}

// Event bus configuration
export interface EventBusConfig {
  enablePersistence?: boolean;
  enableReplay?: boolean;
  middleware?: EventMiddleware[];
  batchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
}