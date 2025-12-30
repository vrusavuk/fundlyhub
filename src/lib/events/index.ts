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
export * from './domain/SearchEvents';
export * from './domain/ProjectEvents';
export * from './domain/StorageEvents';

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
export * from './processors/ProjectUpdateWriteProcessor';

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
import { UserSearchProjectionProcessor } from './processors/UserSearchProjectionProcessor';
import { ProjectUpdateWriteProcessor } from './processors/ProjectUpdateWriteProcessor';

// Export utility classes
export { EventIdempotency, eventIdempotency } from './EventIdempotency';
export { EventVersionManager, eventVersionManager } from './EventVersioning';
export { DeadLetterQueueManager } from './DeadLetterQueueManager';
export { CircuitBreaker, CircuitState } from './CircuitBreaker';

// Export payout domain events
export * from './domain/PayoutEvents';

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
import { logger } from '@/lib/services/logger.service';
globalEventBus.connect().catch((error) => {
  logger.error('Failed to connect global event bus', error as Error, {
    componentName: 'EventBusInitializer',
    operationName: 'connect',
  });
});

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

// Register role management processors
import { RoleAssignmentWriteProcessor } from './processors/RoleAssignmentWriteProcessor';
import { RoleRevocationWriteProcessor } from './processors/RoleRevocationWriteProcessor';
import { RoleCreatedProcessor, RolePermissionsUpdatedProcessor } from './processors/RoleCRUDProcessor';

const roleAssignmentProcessor = new RoleAssignmentWriteProcessor();
const roleRevocationProcessor = new RoleRevocationWriteProcessor();
const roleCreatedProcessor = new RoleCreatedProcessor();
const rolePermissionsProcessor = new RolePermissionsUpdatedProcessor();

globalEventBus.subscribe('admin.user.role_assigned', roleAssignmentProcessor);
globalEventBus.subscribe('admin.user.role_revoked', roleRevocationProcessor);
globalEventBus.subscribe('admin.role.created', roleCreatedProcessor);
globalEventBus.subscribe('admin.role.permissions_updated', rolePermissionsProcessor);

// Register project update processors
const projectUpdateWriteProcessor = new ProjectUpdateWriteProcessor();
globalEventBus.subscribe('project.update.created', projectUpdateWriteProcessor);

logger.info('EventBus processors registered', {
  componentName: 'EventBusInitializer',
  operationName: 'initialize',
  metadata: { 
    processors: ['Campaign', 'RoleManagement', 'ProjectUpdate']
  },
});

// Register search projection processor
const userSearchProjectionProcessor = new UserSearchProjectionProcessor();
globalEventBus.subscribe('user.registered', userSearchProjectionProcessor);
globalEventBus.subscribe('user.profile_updated', userSearchProjectionProcessor);

logger.info('EventBus search processors registered', {
  componentName: 'EventBusInitializer',
  operationName: 'initialize',
  metadata: { processors: ['UserSearchProjection'] },
});

// Register donation event processors
import { DonationWriteProcessor } from './processors/DonationWriteProcessor';
import { DonationProjectionProcessor } from './processors/DonationProjectionProcessor';

const donationWriteProcessor = new DonationWriteProcessor();
const donationProjectionProcessor = new DonationProjectionProcessor();

globalEventBus.subscribe('donation.completed', donationWriteProcessor);
globalEventBus.subscribe('donation.refunded', donationWriteProcessor);
globalEventBus.subscribe('donation.failed', donationWriteProcessor);

globalEventBus.subscribe('donation.completed', donationProjectionProcessor);
globalEventBus.subscribe('donation.refunded', donationProjectionProcessor);
globalEventBus.subscribe('donation.failed', donationProjectionProcessor);

logger.info('EventBus donation processors registered', {
  componentName: 'EventBusInitializer',
  operationName: 'initialize',
  metadata: { processors: ['DonationWrite', 'DonationProjection'] },
});

// Register image/storage event processors
import { ImageWriteProcessor } from './processors/ImageWriteProcessor';
import { ImageAnalyticsProcessor } from './processors/ImageAnalyticsProcessor';
import { ImageCleanupProcessor } from './processors/ImageCleanupProcessor';

const imageWriteProcessor = new ImageWriteProcessor();
const imageAnalyticsProcessor = new ImageAnalyticsProcessor();
const imageCleanupProcessor = new ImageCleanupProcessor();

globalEventBus.subscribe('storage.image.uploaded', imageWriteProcessor);
globalEventBus.subscribe('storage.image.deleted', imageWriteProcessor);
globalEventBus.subscribe('storage.image.linked', imageWriteProcessor);

globalEventBus.subscribe('storage.image.uploaded', imageAnalyticsProcessor);
globalEventBus.subscribe('storage.image.deleted', imageAnalyticsProcessor);
globalEventBus.subscribe('storage.image.optimized', imageAnalyticsProcessor);

globalEventBus.subscribe('storage.draft.cleanup_requested', imageCleanupProcessor);

logger.info('EventBus image/storage processors registered', {
  componentName: 'EventBusInitializer',
  operationName: 'initialize',
  metadata: { processors: ['ImageWrite', 'ImageAnalytics', 'ImageCleanup'] },
});

// Initialize subscription event subscribers
import { initializeSubscriptionSubscribers } from './subscribers/SubscriptionEventSubscriber';
initializeSubscriptionSubscribers(globalEventBus);

// Initialize project update subscribers
import { initializeProjectUpdateSubscribers } from './subscribers/ProjectUpdateSubscriber';
initializeProjectUpdateSubscribers(globalEventBus);

// Register payout event processors
import {
  PayoutRequestedProcessor,
  PayoutApprovedProcessor,
  PayoutDeniedProcessor,
  PayoutProcessingProcessor,
  PayoutCompletedProcessor,
  PayoutFailedProcessor,
  PayoutCancelledProcessor,
  PayoutInfoRequiredProcessor,
} from './processors/PayoutRequestWriteProcessor';

const payoutRequestedProcessor = new PayoutRequestedProcessor();
const payoutApprovedProcessor = new PayoutApprovedProcessor();
const payoutDeniedProcessor = new PayoutDeniedProcessor();
const payoutProcessingProcessor = new PayoutProcessingProcessor();
const payoutCompletedProcessor = new PayoutCompletedProcessor();
const payoutFailedProcessor = new PayoutFailedProcessor();
const payoutCancelledProcessor = new PayoutCancelledProcessor();
const payoutInfoRequiredProcessor = new PayoutInfoRequiredProcessor();

globalEventBus.subscribe('payout.requested', payoutRequestedProcessor);
globalEventBus.subscribe('payout.approved', payoutApprovedProcessor);
globalEventBus.subscribe('payout.denied', payoutDeniedProcessor);
globalEventBus.subscribe('payout.processing', payoutProcessingProcessor);
globalEventBus.subscribe('payout.completed', payoutCompletedProcessor);
globalEventBus.subscribe('payout.failed', payoutFailedProcessor);
globalEventBus.subscribe('payout.cancelled', payoutCancelledProcessor);
globalEventBus.subscribe('payout.info_required', payoutInfoRequiredProcessor);

logger.info('EventBus payout processors registered', {
  componentName: 'EventBusInitializer',
  operationName: 'initialize',
  metadata: { processors: ['PayoutRequestWrite'] },
});

// Initialize notification service
import { notificationService } from '@/lib/services/NotificationService';
notificationService.initialize();
