/**
 * Campaign Write Processor
 * Handles idempotent writes to fundraisers table from campaign events
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { CampaignCreatedEvent, CampaignUpdatedEvent } from '../domain/CampaignEvents';
import { eventIdempotency } from '../EventIdempotency';
import { generateFundraiserSlug } from '@/lib/business-rules/fundraiser-creation.rules';

export class CampaignWriteProcessor implements EventHandler<CampaignCreatedEvent | CampaignUpdatedEvent> {
  readonly eventType = 'campaign.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'CampaignWriteProcessor');
    
    if (!shouldProcess) {
      console.log(`[CampaignWriteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      if (event.type === 'campaign.created') {
        await this.handleCampaignCreated(event as CampaignCreatedEvent);
      } else if (event.type === 'campaign.updated') {
        await this.handleCampaignUpdated(event as CampaignUpdatedEvent);
      }

      await eventIdempotency.markComplete(event.id, 'CampaignWriteProcessor');
      console.log(`[CampaignWriteProcessor] Successfully processed event ${event.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'CampaignWriteProcessor', errorMessage);
      console.error(`[CampaignWriteProcessor] Failed to process event ${event.id}:`, error);
      throw error;
    }
  }

  private async handleCampaignCreated(event: CampaignCreatedEvent): Promise<void> {
    const { payload } = event;
    
    // Campaign is already created by the frontend mutation service
    // This processor handles additional side effects only
    console.log(`[CampaignWriteProcessor] Processing campaign.created for campaign ${payload.campaignId}`);
    
    // Side effects like notifications, analytics would go here
    // The actual DB write is handled by fundraiserMutationService
  }

  private async handleCampaignUpdated(event: CampaignUpdatedEvent): Promise<void> {
    const { payload } = event;

    // Campaign update is already handled by the frontend mutation service
    // This processor handles additional side effects only
    console.log(`[CampaignWriteProcessor] Processing campaign.updated for campaign ${payload.campaignId}`);
    
    // Side effects like cache invalidation, notifications would go here
  }
}
