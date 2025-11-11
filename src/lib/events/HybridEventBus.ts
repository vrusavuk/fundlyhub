/**
 * Hybrid Event Bus
 * Combines in-memory, Supabase, and Redis for complete event-driven architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus as IEventBus, DomainEvent, EventHandler, EventBusConfig } from './types';
import { EventBus } from './EventBus';
import { SupabaseEventStore } from './SupabaseEventStore';
import { RedisEventStream } from './RedisEventStream';
import { CircuitBreaker } from './CircuitBreaker';
import { logger } from '@/lib/services/logger.service';

export interface HybridEventBusConfig extends EventBusConfig {
  supabase: SupabaseClient;
  redis?: {
    url: string;
    token: string;
  };
  enableRemotePublish?: boolean;
  enableEdgeFunctionTrigger?: boolean;
}

export class HybridEventBus implements IEventBus {
  private localBus: EventBus;
  private supabaseStore: SupabaseEventStore;
  private redisStream: RedisEventStream | null = null;
  private supabase: SupabaseClient;
  private enableRemotePublish: boolean;
  private enableEdgeFunctionTrigger: boolean;
  private _isConnected = false;
  private readonly clientId = crypto.randomUUID();
  private realtimeChannel: any = null;
  private edgeFunctionCircuitBreaker: CircuitBreaker;

  constructor(config: HybridEventBusConfig) {
    this.supabase = config.supabase;
    this.enableRemotePublish = config.enableRemotePublish ?? true;
    this.enableEdgeFunctionTrigger = config.enableEdgeFunctionTrigger ?? true;

    // Initialize Supabase event store
    this.supabaseStore = new SupabaseEventStore(config.supabase);

    // Initialize in-memory event bus with Supabase store
    this.localBus = new EventBus(
      {
        ...config,
        enablePersistence: false, // We handle persistence here
      },
      this.supabaseStore
    );

    // Initialize Redis stream if credentials provided
    if (config.redis) {
      this.redisStream = new RedisEventStream({
        url: config.redis.url,
        token: config.redis.token,
      });
    }

    // Initialize circuit breaker for edge function calls
    this.edgeFunctionCircuitBreaker = new CircuitBreaker({
      threshold: 5,        // Open after 5 consecutive failures
      timeout: 60000,      // Try again after 60 seconds
      halfOpenAttempts: 3  // Close after 3 successful calls
    });
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    try {
      // Connect local bus
      await this.localBus.connect();

      // Connect Redis if available
      if (this.redisStream) {
        await this.redisStream.connect();
      }

      // Subscribe to Supabase real-time events
      this.subscribeToRealtimeEvents();

      this._isConnected = true;
      logger.info('Hybrid Event Bus connected', {
        componentName: 'HybridEventBus',
        operationName: 'connect',
      });
    } catch (error) {
      logger.error('Failed to connect Hybrid Event Bus', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'connect',
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.localBus.disconnect();
      this.supabaseStore.disconnect();

      if (this.redisStream) {
        await this.redisStream.disconnect();
      }

      if (this.realtimeChannel) {
        await this.supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      this._isConnected = false;
      logger.info('Hybrid Event Bus disconnected', {
        componentName: 'HybridEventBus',
        operationName: 'disconnect',
      });
    } catch (error) {
      logger.error('Failed to disconnect Hybrid Event Bus', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'disconnect',
      });
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    if (!this._isConnected) {
      throw new Error('HybridEventBus is not connected');
    }

    try {
      // Add client ID to metadata to prevent re-publishing own events
      const enrichedEvent = {
        ...event,
        metadata: { 
          ...event.metadata, 
          clientId: this.clientId 
        }
      };

      // 1. Persist to Supabase first (event sourcing)
      await this.supabaseStore.save(enrichedEvent);

      // 2. Publish to local bus for immediate UI update (no persistence)
      await this.localBus.publish(enrichedEvent);

      // 3. Publish to Redis for distributed processing (if enabled, server-side only)
      if (this.enableRemotePublish && this.redisStream) {
        await this.redisStream.publishToStream(enrichedEvent).catch(error => {
          logger.warn('Failed to publish to Redis, continuing', {
            componentName: 'HybridEventBus',
            operationName: 'publish',
            metadata: { eventType: enrichedEvent.type, error: error instanceof Error ? error.message : String(error) },
          });
        });
      }

      // 4. Trigger edge function for server-side processing (if enabled)
      if (this.enableEdgeFunctionTrigger) {
        // Fire and forget - don't block on edge function
        this.triggerServerProcessing(enrichedEvent).catch(error => {
          logger.warn('Failed to trigger edge function, continuing', {
            componentName: 'HybridEventBus',
            operationName: 'publish',
            metadata: { eventType: enrichedEvent.type, error: error instanceof Error ? error.message : String(error) },
          });
        });
      }
    } catch (error) {
      logger.error('Failed to publish event', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'publish',
        metadata: { eventType: event.type },
      });
      throw error;
    }
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    if (!this._isConnected) {
      throw new Error('HybridEventBus is not connected');
    }

    try {
      // Add client ID to all events
      const enrichedEvents = events.map(event => ({
        ...event,
        metadata: { 
          ...event.metadata, 
          clientId: this.clientId 
        }
      }));

      // 1. Persist to Supabase in batch
      await this.supabaseStore.saveBatch(enrichedEvents);

      // 2. Publish to local bus
      await this.localBus.publishBatch(enrichedEvents);

      // 3. Publish to Redis in batch (if enabled)
      if (this.enableRemotePublish && this.redisStream) {
        await this.redisStream.publishBatch(enrichedEvents).catch(error => {
          logger.warn('Failed to publish batch to Redis, continuing', {
            componentName: 'HybridEventBus',
            operationName: 'publishBatch',
            metadata: { eventCount: enrichedEvents.length, error: error instanceof Error ? error.message : String(error) },
          });
        });
      }

      // 4. Trigger edge function for batch (if enabled)
      if (this.enableEdgeFunctionTrigger) {
        this.triggerBatchProcessing(enrichedEvents).catch(error => {
          logger.warn('Failed to trigger edge function batch, continuing', {
            componentName: 'HybridEventBus',
            operationName: 'publishBatch',
            metadata: { eventCount: enrichedEvents.length, error: error instanceof Error ? error.message : String(error) },
          });
        });
      }
    } catch (error) {
      logger.error('Failed to publish event batch', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'publishBatch',
        metadata: { eventCount: events.length },
      });
      throw error;
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    return this.localBus.subscribe(eventType, handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    this.localBus.unsubscribe(eventType, handler);
  }

  unsubscribeAll(): void {
    this.localBus.unsubscribeAll();
  }

  async replay(fromTimestamp?: number): Promise<void> {
    await this.localBus.replay(fromTimestamp);
  }

  /**
   * Subscribe to Supabase real-time events from other clients
   */
  private subscribeToRealtimeEvents(): void {
    this.realtimeChannel = this.supabase
      .channel('hybrid-event-bus')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_store' },
        (payload) => {
          try {
            const event = this.mapPayloadToEvent(payload.new);
            
            // CRITICAL: Skip events from this client to prevent loops
            if (event.metadata?.clientId === this.clientId) {
              return;
            }
            
            // Dispatch to local handlers only, DO NOT re-publish
            const handlers = (this.localBus as any).handlers?.get(event.type) || [];
            for (const handler of handlers) {
              try {
                handler.handle(event);
              } catch (error) {
                logger.error('Handler error in realtime event', error as Error, {
                  componentName: 'HybridEventBus',
                  operationName: 'subscribeToRealtimeEvents',
                  metadata: { eventType: event.type },
                });
              }
            }
          } catch (error) {
            logger.error('Error processing realtime event', error as Error, {
              componentName: 'HybridEventBus',
              operationName: 'subscribeToRealtimeEvents',
            });
          }
        }
      )
      .subscribe();
  }
  
  private mapPayloadToEvent(payload: any): DomainEvent {
    return {
      id: payload.event_id,
      type: payload.event_type,
      payload: payload.event_data,
      timestamp: new Date(payload.occurred_at).getTime(),
      version: payload.event_version,
      correlationId: payload.correlation_id,
      causationId: payload.causation_id,
      metadata: payload.metadata || {}
    };
  }

  /**
   * Trigger edge function for server-side processing
   */
  private async triggerServerProcessing(event: DomainEvent): Promise<void> {
    try {
      await this.edgeFunctionCircuitBreaker.execute(async () => {
        const { error } = await this.supabase.functions.invoke('event-processor', {
          body: { event }
        });

        if (error) {
          throw new Error(`Edge function error: ${JSON.stringify(error)}`);
        }
      });
    } catch (error) {
      const circuitState = this.edgeFunctionCircuitBreaker.getState();
      logger.error('Failed to invoke edge function', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'triggerServerProcessing',
        metadata: { circuitState, eventType: event.type },
      });
    }
  }

  /**
   * Trigger edge function for batch processing
   */
  private async triggerBatchProcessing(events: DomainEvent[]): Promise<void> {
    try {
      await this.edgeFunctionCircuitBreaker.execute(async () => {
        const { error } = await this.supabase.functions.invoke('event-processor', {
          body: { events }
        });

        if (error) {
          throw new Error(`Edge function batch error: ${JSON.stringify(error)}`);
        }
      });
    } catch (error) {
      const circuitState = this.edgeFunctionCircuitBreaker.getState();
      logger.error('Failed to invoke edge function batch', error as Error, {
        componentName: 'HybridEventBus',
        operationName: 'triggerBatchProcessing',
        metadata: { circuitState, eventCount: events.length },
      });
    }
  }

  /**
   * Get Redis stream instance (for server-side consumers)
   */
  getRedisStream(): RedisEventStream | null {
    return this.redisStream;
  }

  /**
   * Get Supabase event store instance
   */
  getEventStore(): SupabaseEventStore {
    return this.supabaseStore;
  }

  /**
   * Get circuit breaker state (for monitoring)
   */
  getCircuitBreakerStats() {
    return this.edgeFunctionCircuitBreaker.getStats();
  }
}
