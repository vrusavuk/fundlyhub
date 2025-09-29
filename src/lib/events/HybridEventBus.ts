/**
 * Hybrid Event Bus
 * Combines in-memory, Supabase, and Redis for complete event-driven architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus as IEventBus, DomainEvent, EventHandler, EventBusConfig } from './types';
import { EventBus } from './EventBus';
import { SupabaseEventStore } from './SupabaseEventStore';
import { RedisEventStream } from './RedisEventStream';

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
      console.log('Hybrid Event Bus connected');
    } catch (error) {
      console.error('Failed to connect Hybrid Event Bus:', error);
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

      this._isConnected = false;
      console.log('Hybrid Event Bus disconnected');
    } catch (error) {
      console.error('Failed to disconnect Hybrid Event Bus:', error);
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      // 1. Publish to local bus first (instant UI update)
      await this.localBus.publish(event);

      // 2. Persist to Supabase (event sourcing)
      await this.supabaseStore.save(event);

      // 3. Publish to Redis for distributed processing (if enabled)
      if (this.enableRemotePublish && this.redisStream) {
        await this.redisStream.publishToStream(event).catch(error => {
          console.warn('Failed to publish to Redis, continuing:', error);
        });
      }

      // 4. Trigger edge function for server-side processing (if enabled)
      if (this.enableEdgeFunctionTrigger) {
        await this.triggerServerProcessing(event).catch(error => {
          console.warn('Failed to trigger edge function, continuing:', error);
        });
      }
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    try {
      // 1. Publish to local bus
      await this.localBus.publishBatch(events);

      // 2. Persist to Supabase in batch
      await this.supabaseStore.saveBatch(events);

      // 3. Publish to Redis in batch (if enabled)
      if (this.enableRemotePublish && this.redisStream) {
        await this.redisStream.publishBatch(events).catch(error => {
          console.warn('Failed to publish batch to Redis, continuing:', error);
        });
      }

      // 4. Trigger edge function for batch (if enabled)
      if (this.enableEdgeFunctionTrigger) {
        await this.triggerBatchProcessing(events).catch(error => {
          console.warn('Failed to trigger edge function batch, continuing:', error);
        });
      }
    } catch (error) {
      console.error('Failed to publish event batch:', error);
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
    this.supabaseStore.streamEvents((event) => {
      // Dispatch to local handlers without re-persisting
      this.localBus.subscribe(event.type, {
        eventType: event.type,
        handle: () => {
          // Events from other clients, just dispatch locally
        }
      });
    });
  }

  /**
   * Trigger edge function for server-side processing
   */
  private async triggerServerProcessing(event: DomainEvent): Promise<void> {
    try {
      const { error } = await this.supabase.functions.invoke('event-processor', {
        body: { event }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
      }
    } catch (error) {
      console.error('Failed to invoke edge function:', error);
    }
  }

  /**
   * Trigger edge function for batch processing
   */
  private async triggerBatchProcessing(events: DomainEvent[]): Promise<void> {
    try {
      const { error } = await this.supabase.functions.invoke('event-processor', {
        body: { events }
      });

      if (error) {
        console.error('Edge function batch invocation error:', error);
      }
    } catch (error) {
      console.error('Failed to invoke edge function for batch:', error);
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
}
