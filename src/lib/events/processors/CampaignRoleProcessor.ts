/**
 * Campaign Role Processor
 * 
 * NOTE: Role updates are now handled by the database trigger `sync_user_role_from_activity`
 * which automatically promotes users to 'creator' role via RBAC when they create a campaign.
 * 
 * This processor is kept for backward compatibility to update the legacy profiles.role column
 * until it is fully deprecated and removed.
 */

import { supabase } from '@/integrations/supabase/client';
import type { EventHandler } from '../types';
import type { CampaignCreatedEvent } from '../domain/CampaignEvents';
import { eventIdempotency } from '../EventIdempotency';

export class CampaignRoleProcessor implements EventHandler<CampaignCreatedEvent> {
  readonly eventType = 'campaign.created';

  async handle(event: CampaignCreatedEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'CampaignRoleProcessor');
    
    if (!shouldProcess) {
      return;
    }

    try {
      const { userId } = event.payload;

      // Role updates are now handled by the database trigger `sync_user_role_from_activity`
      // This processor just logs the event for backward compatibility
      console.log(`[CampaignRoleProcessor] Campaign created by user ${userId} - role sync handled by database trigger`);

      await eventIdempotency.markComplete(event.id, 'CampaignRoleProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'CampaignRoleProcessor', errorMessage);
      console.error('[CampaignRoleProcessor] Error:', error);
    }
  }
}
