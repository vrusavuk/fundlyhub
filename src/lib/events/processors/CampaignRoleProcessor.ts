/**
 * Campaign Role Processor
 * Updates user role to 'creator' when they create their first campaign
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
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

      // Check current user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Only promote if user is currently a visitor
      if (profile?.role === 'visitor') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'creator' })
          .eq('id', userId);

        if (error) {
          console.error('[CampaignRoleProcessor] Failed to update role:', error);
        } else {
          console.log(`[CampaignRoleProcessor] Promoted user ${userId} to creator`);
        }
      }

      await eventIdempotency.markComplete(event.id, 'CampaignRoleProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'CampaignRoleProcessor', errorMessage);
      console.error('[CampaignRoleProcessor] Error:', error);
    }
  }
}
