/**
 * Redis Event Stream Manager
 * Handles distributed event processing using Upstash Redis Streams
 * Note: Consumer groups are server-side only features
 */

import { Redis } from '@upstash/redis';
import { DomainEvent } from './types';
import { logger } from '@/lib/services/logger.service';

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
      logger.error('Redis max reconnect attempts reached', undefined, {
        componentName: 'RedisEventStream',
        operationName: 'handleReconnect',
        metadata: { attempts: this.reconnectAttempts },
      });
      this.isConnected = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

    logger.info('Redis reconnecting', {
      componentName: 'RedisEventStream',
      operationName: 'handleReconnect',
      metadata: { delay, attempt: this.reconnectAttempts },
    });
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      logger.error('Redis reconnect failed', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'handleReconnect',
        metadata: { attempt: this.reconnectAttempts },
      });
    }
  }

  async connect(): Promise<void> {
    try {
      // Test connection by pinging Redis
      await this.redis.ping();
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset on successful connection
      logger.info('Redis Event Stream connected', {
        componentName: 'RedisEventStream',
        operationName: 'connect',
      });
    } catch (error) {
      logger.error('Failed to connect to Redis', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'connect',
      });
      await this.handleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('Redis Event Stream disconnected', {
      componentName: 'RedisEventStream',
      operationName: 'disconnect',
    });
  }

  /**
   * Publish a single event to Redis Stream
   */
  async publishToStream(event: DomainEvent): Promise<string | null> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, attempting reconnect', {
        componentName: 'RedisEventStream',
        operationName: 'publishToStream',
        metadata: { eventType: event.type },
      });
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
      logger.error('Failed to publish event to Redis stream', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'publishToStream',
        metadata: { eventType: event.type },
      });
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
      logger.warn('Redis not connected, skipping batch publish', {
        componentName: 'RedisEventStream',
        operationName: 'publishBatch',
        metadata: { eventCount: events.length },
      });
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
      logger.error('Failed to publish batch to Redis stream', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'publishBatch',
        metadata: { eventCount: events.length },
      });
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
            logger.error('Failed to parse message', error as Error, {
              componentName: 'RedisEventStream',
              operationName: 'readEvents',
            });
          }
        }
      }

      return events;
    } catch (error) {
      logger.error('Failed to read events', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'readEvents',
      });
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
      logger.error('Failed to get stream length', error as Error, {
        componentName: 'RedisEventStream',
        operationName: 'getStreamLength',
      });
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
