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

// Create default event bus instance
import { EventBus } from './EventBus';
import { InMemoryEventStore } from './EventStore';
import { LoggingMiddleware } from './middleware/LoggingMiddleware';
import { ValidationMiddleware } from './middleware/ValidationMiddleware';

// Create event store instance
const eventStore = new InMemoryEventStore();

// Create middleware instances
const loggingMiddleware = new LoggingMiddleware('info', true, false);
const validationMiddleware = new ValidationMiddleware(false, false); // Non-strict for now

export const globalEventBus = new EventBus({
  enablePersistence: true,
  enableReplay: true,
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
  middleware: [loggingMiddleware, validationMiddleware],
}, eventStore);

// Initialize the event bus
globalEventBus.connect().catch(console.error);