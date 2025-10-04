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
export * from './domain/OrganizationEvents';
export * from './domain/AdminEvents';

// Publishers
export * from './publishers/ServiceEventPublisher';

// Subscribers
export * from './subscribers/AnalyticsSubscriber';
export * from './subscribers/CacheSubscriber';
export * from './subscribers/SubscriptionEventSubscriber';

// Event Processors (Phase 1)
export * from './processors/CampaignWriteProcessor';
export * from './processors/CampaignProjectionProcessor';
export * from './processors/CampaignRoleProcessor';

// Saga Managers (Phase 4)
export * from './sagas/CampaignCreationSaga';

// Monitoring (Phase 5)
export * from './monitoring/EventMetrics';

// Create hybrid event bus instance
import { HybridEventBus } from './HybridEventBus';
import { supabase } from '@/integrations/supabase/client';
import { LoggingMiddleware } from './middleware/LoggingMiddleware';
import { ValidationMiddleware } from './middleware/ValidationMiddleware';

// Import processors
import { CampaignWriteProcessor } from './processors/CampaignWriteProcessor';
import { CampaignProjectionProcessor } from './processors/CampaignProjectionProcessor';
import { CampaignRoleProcessor } from './processors/CampaignRoleProcessor';

// Export utility classes
export { EventIdempotency, eventIdempotency } from './EventIdempotency';
export { EventVersionManager, eventVersionManager } from './EventVersioning';
export { DeadLetterQueueManager } from './DeadLetterQueueManager';
export { CircuitBreaker, CircuitState } from './CircuitBreaker';

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

// Register campaign event processors
const campaignWriteProcessor = new CampaignWriteProcessor();
const campaignProjectionProcessor = new CampaignProjectionProcessor();
const campaignRoleProcessor = new CampaignRoleProcessor();

globalEventBus.subscribe('campaign.created', campaignWriteProcessor);
globalEventBus.subscribe('campaign.updated', campaignWriteProcessor);
globalEventBus.subscribe('campaign.created', campaignProjectionProcessor);
globalEventBus.subscribe('campaign.updated', campaignProjectionProcessor);
globalEventBus.subscribe('campaign.deleted', campaignProjectionProcessor);
globalEventBus.subscribe('campaign.created', campaignRoleProcessor);

console.log('[EventBus] Campaign processors registered');

// Initialize subscription event subscribers
import { initializeSubscriptionSubscribers } from './subscribers/SubscriptionEventSubscriber';
initializeSubscriptionSubscribers(globalEventBus);
