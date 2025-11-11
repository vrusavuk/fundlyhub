/**
 * Logging Middleware for Event Bus
 * Following Single Responsibility Principle
 */

import { EventMiddleware, DomainEvent } from '../types';
import { logger } from '@/lib/services/logger.service';

export class LoggingMiddleware implements EventMiddleware {
  constructor(
    private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info',
    private enableConsoleLogging = true,
    private enableStructuredLogging = false
  ) {}

  async beforePublish<T extends DomainEvent>(event: T): Promise<T> {
    if (this.enableConsoleLogging) {
      logger.debug('EventBus publishing event', {
        componentName: 'LoggingMiddleware',
        operationName: 'beforePublish',
        metadata: {
          eventType: event.type,
          eventId: event.id,
          timestamp: new Date(event.timestamp).toISOString(),
          correlationId: event.correlationId,
        },
      });
    }

    if (this.enableStructuredLogging) {
      this.logStructured('event.published', {
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        correlationId: event.correlationId,
        payloadSize: JSON.stringify(event.payload).length,
      });
    }

    return event;
  }

  async afterPublish<T extends DomainEvent>(event: T): Promise<void> {
    if (this.logLevel === 'debug' && this.enableConsoleLogging) {
      logger.debug('EventBus event published successfully', {
        componentName: 'LoggingMiddleware',
        operationName: 'afterPublish',
        metadata: {
          eventType: event.type,
          eventId: event.id,
          processingTime: Date.now() - event.timestamp,
        },
      });
    }
  }

  async onError(error: Error, event: DomainEvent): Promise<void> {
    logger.error('EventBus error processing event', error, {
      componentName: 'LoggingMiddleware',
      operationName: 'onError',
      metadata: {
        eventType: event.type,
        eventId: event.id,
        correlationId: event.correlationId,
      },
    });

    if (this.enableStructuredLogging) {
      this.logStructured('event.error', {
        eventId: event.id,
        eventType: event.type,
        errorMessage: error.message,
        errorName: error.name,
        correlationId: event.correlationId,
        timestamp: Date.now(),
      });
    }
  }

  private logStructured(action: string, data: Record<string, any>): void {
    // In a real application, this would send to a structured logging service
    // like DataDog, Splunk, or ELK stack
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'event-bus',
      action,
      ...data,
    };

    // For now, just log to console in a structured format
    console.log(JSON.stringify(logEntry));
  }
}