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

export const globalEventBus = new EventBus({
  enablePersistence: false, // Will be enabled when EventStore is implemented
  enableReplay: false,
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
});

// Initialize the event bus
globalEventBus.connect().catch(console.error);