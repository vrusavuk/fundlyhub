/**
 * Event System Barrel Exports
 * Following Interface Segregation Principle
 */

// Core types and interfaces
export * from './types';

// Event bus implementation
export { EventBus } from './EventBus';

// Domain events
export * from './domain/UserEvents';
export * from './domain/CampaignEvents';
export * from './domain/DonationEvents';

// Publishers
export * from './publishers/ServiceEventPublisher';

// Subscribers
export * from './subscribers/AnalyticsSubscriber';
export * from './subscribers/CacheSubscriber';

// Create hybrid event bus instance
import { HybridEventBus } from './HybridEventBus';
import { supabase } from '@/integrations/supabase/client';
import { LoggingMiddleware } from './middleware/LoggingMiddleware';
import { ValidationMiddleware } from './middleware/ValidationMiddleware';

// Create middleware instances
const loggingMiddleware = new LoggingMiddleware('info', true, false);
const validationMiddleware = new ValidationMiddleware(false, false);

// Redis is server-side only, frontend doesn't need it
export const globalEventBus = new HybridEventBus({
  supabase,
  redis: undefined, // Server-side edge functions will use Redis
  enablePersistence: true,
  enableReplay: true,
  enableRemotePublish: false, // Frontend doesn't publish to Redis directly
  enableEdgeFunctionTrigger: true,
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
  middleware: [loggingMiddleware, validationMiddleware],
});

// Initialize the event bus
globalEventBus.connect().catch(console.error);