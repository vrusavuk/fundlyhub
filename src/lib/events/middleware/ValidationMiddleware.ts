/**
 * Validation Middleware for Event Bus
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { EventMiddleware, DomainEvent } from '../types';

// Base event schema for validation
const BaseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  timestamp: z.number().positive(),
  version: z.string().min(1),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  payload: z.record(z.any()),
});

export class ValidationMiddleware implements EventMiddleware {
  private eventSchemas = new Map<string, z.ZodSchema>();

  constructor(
    private strictValidation = true,
    private throwOnValidationError = true
  ) {}

  /**
   * Register a schema for a specific event type
   * Following Open/Closed Principle
   */
  registerEventSchema(eventType: string, schema: z.ZodSchema): void {
    this.eventSchemas.set(eventType, schema);
  }

  /**
   * Register multiple schemas at once
   */
  registerEventSchemas(schemas: Record<string, z.ZodSchema>): void {
    Object.entries(schemas).forEach(([eventType, schema]) => {
      this.registerEventSchema(eventType, schema);
    });
  }

  async beforePublish<T extends DomainEvent>(event: T): Promise<T> {
    // Always validate base event structure
    const baseValidation = BaseEventSchema.safeParse(event);
    if (!baseValidation.success) {
      const error = new ValidationError(
        `Invalid event structure: ${baseValidation.error.message}`,
        event.type,
        baseValidation.error.errors
      );
      
      if (this.throwOnValidationError) {
        throw error;
      } else {
        console.warn('[ValidationMiddleware] Base validation failed:', error);
        return event;
      }
    }

    // Validate event-specific schema if registered
    const eventSchema = this.eventSchemas.get(event.type);
    if (eventSchema) {
      const validation = eventSchema.safeParse(event);
      if (!validation.success) {
        const error = new ValidationError(
          `Invalid event payload for ${event.type}: ${validation.error.message}`,
          event.type,
          validation.error.errors
        );
        
        if (this.throwOnValidationError) {
          throw error;
        } else {
          console.warn('[ValidationMiddleware] Event validation failed:', error);
          return event;
        }
      }
    } else if (this.strictValidation) {
      const error = new ValidationError(
        `No schema registered for event type: ${event.type}`,
        event.type,
        []
      );
      
      if (this.throwOnValidationError) {
        throw error;
      } else {
        console.warn('[ValidationMiddleware] No schema found:', error);
      }
    }

    return event;
  }

  async onError(error: Error, event: DomainEvent): Promise<void> {
    if (error instanceof ValidationError) {
      console.error('[ValidationMiddleware] Validation error:', {
        eventType: event.type,
        eventId: event.id,
        validationErrors: error.validationErrors,
        message: error.message,
      });
    }
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly eventType: string,
    public readonly validationErrors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}