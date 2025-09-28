/**
 * Logging Middleware for Event Bus
 * Following Single Responsibility Principle
 */

import { EventMiddleware, DomainEvent } from '../types';

export class LoggingMiddleware implements EventMiddleware {
  constructor(
    private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info',
    private enableConsoleLogging = true,
    private enableStructuredLogging = false
  ) {}

  async beforePublish<T extends DomainEvent>(event: T): Promise<T> {
    if (this.enableConsoleLogging) {
      console.log(`[EventBus] Publishing event: ${event.type}`, {
        id: event.id,
        timestamp: new Date(event.timestamp).toISOString(),
        correlationId: event.correlationId,
        payload: event.payload,
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
      console.log(`[EventBus] Event published successfully: ${event.type}`, {
        id: event.id,
        processingTime: Date.now() - event.timestamp,
      });
    }
  }

  async onError(error: Error, event: DomainEvent): Promise<void> {
    console.error(`[EventBus] Error processing event: ${event.type}`, {
      eventId: event.id,
      error: error.message,
      stack: error.stack,
      correlationId: event.correlationId,
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