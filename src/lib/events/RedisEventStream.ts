/**
 * Redis Event Stream Manager
 * Handles distributed event processing using Upstash Redis Streams
 * Note: Consumer groups are server-side only features
 */

import { Redis } from '@upstash/redis';
import { DomainEvent } from './types';

export interface RedisStreamConfig {
  url: string;
  token: string;
  streamName?: string;
  maxRetries?: number;
}

export class RedisEventStream {
  private redis: Redis;
  private streamName: string;
  private maxRetries: number;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: RedisStreamConfig) {
    this.redis = new Redis({
      url: config.url,
      token: config.token,
      retry: {
        retries: 3,
        backoff: (retryCount: number) => {
          return Math.min(retryCount * 100, 3000);
        }
      },
      automaticDeserialization: false,
    });
    this.streamName = config.streamName || 'events';
    this.maxRetries = config.maxRetries || 3;
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    // Note: Upstash Redis client doesn't support event listeners
    // Error handling is done in individual operations
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Redis] Max reconnect attempts reached');
      this.isConnected = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error('[Redis] Reconnect failed:', error);
    }
  }

  async connect(): Promise<void> {
    try {
      // Test connection by pinging Redis
      await this.redis.ping();
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset on successful connection
      console.log('Redis Event Stream connected');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      await this.handleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Redis Event Stream disconnected');
  }

  /**
   * Publish a single event to Redis Stream
   */
  async publishToStream(event: DomainEvent): Promise<string | null> {
    if (!this.isConnected) {
      console.warn('Redis not connected, attempting reconnect...');
      await this.handleReconnect();
      if (!this.isConnected) {
        return null;
      }
    }

    try {
      const streamId = await this.redis.xadd(
        this.streamName,
        '*',
        {
          id: event.id,
          type: event.type,
          payload: JSON.stringify(event.payload),
          timestamp: event.timestamp.toString(),
          version: event.version,
          correlationId: event.correlationId || '',
          causationId: event.causationId || '',
          metadata: JSON.stringify(event.metadata || {})
        }
      );

      this.reconnectAttempts = 0; // Reset on success
      return streamId as string;
    } catch (error) {
      console.error('Failed to publish event to Redis stream:', error);
      this.isConnected = false;
      await this.handleReconnect();
      throw error;
    }
  }

  /**
   * Publish multiple events as a batch
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping batch publish');
      return;
    }

    const pipeline = this.redis.pipeline();

    events.forEach(event => {
      pipeline.xadd(
        this.streamName,
        '*',
        {
          id: event.id,
          type: event.type,
          payload: JSON.stringify(event.payload),
          timestamp: event.timestamp.toString(),
          version: event.version,
          correlationId: event.correlationId || '',
          causationId: event.causationId || '',
          metadata: JSON.stringify(event.metadata || {})
        }
      );
    });

    try {
      await pipeline.exec();
    } catch (error) {
      console.error('Failed to publish batch to Redis stream:', error);
      throw error;
    }
  }

  /**
   * Read events from the stream
   * Simplified version for frontend use
   */
  async readEvents(lastId: string = '0', count: number = 100): Promise<DomainEvent[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const result: any = await this.redis.xread([this.streamName], [lastId], { count });
      
      if (!result || result.length === 0) return [];

      const events: DomainEvent[] = [];
      for (const [streamName, messages] of result) {
        for (const [id, fields] of messages) {
          try {
            const event = this.parseStreamMessage(fields as Record<string, string>);
            events.push(event);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        }
      }

      return events;
    } catch (error) {
      console.error('Failed to read events:', error);
      return [];
    }
  }

  /**
   * Get stream length
   */
  async getStreamLength(): Promise<number> {
    try {
      const length = await this.redis.xlen(this.streamName);
      return length;
    } catch (error) {
      console.error('Failed to get stream length:', error);
      return 0;
    }
  }

  private parseStreamMessage(fields: Record<string, string>): DomainEvent {
    return {
      id: fields.id,
      type: fields.type,
      payload: JSON.parse(fields.payload),
      timestamp: parseInt(fields.timestamp),
      version: fields.version,
      correlationId: fields.correlationId || undefined,
      causationId: fields.causationId || undefined,
      metadata: fields.metadata ? JSON.parse(fields.metadata) : undefined
    };
  }
}
