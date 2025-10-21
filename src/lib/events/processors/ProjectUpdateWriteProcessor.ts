/**
 * Project Update Write Processor
 * Handles idempotent writes to project_updates table from project update events
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { ProjectUpdateCreatedEvent } from '../domain/ProjectEvents';
import { eventIdempotency } from '../EventIdempotency';

export class ProjectUpdateWriteProcessor implements EventHandler<ProjectUpdateCreatedEvent> {
  readonly eventType = 'project.update.created';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id, 
      'ProjectUpdateWriteProcessor'
    );
    
    if (!shouldProcess) {
      console.log(`[ProjectUpdateWriteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      if (event.type === 'project.update.created') {
        await this.handleUpdateCreated(event as ProjectUpdateCreatedEvent);
      }

      await eventIdempotency.markComplete(event.id, 'ProjectUpdateWriteProcessor');
      console.log(`[ProjectUpdateWriteProcessor] Successfully processed event ${event.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(
        event.id, 
        'ProjectUpdateWriteProcessor', 
        errorMessage
      );
      console.error(`[ProjectUpdateWriteProcessor] Failed to process event ${event.id}:`, error);
      throw error;
    }
  }

  private async handleUpdateCreated(event: ProjectUpdateCreatedEvent): Promise<void> {
    const { payload } = event;
    
    // Server-side authorization check
    const { data: fundraiser } = await supabase
      .from('fundraisers')
      .select('owner_user_id, org_id')
      .eq('id', payload.fundraiserId)
      .single();

    if (!fundraiser) {
      throw new Error('Fundraiser not found');
    }

    const isOwner = fundraiser.owner_user_id === payload.authorId;
    
    if (!isOwner) {
      throw new Error('Unauthorized: Only fundraiser owners can post updates');
    }

    // Idempotent insert - check if update already exists
    const { data: existing } = await supabase
      .from('project_updates')
      .select('id')
      .eq('id', payload.updateId)
      .maybeSingle();

    if (existing) {
      console.log(`[ProjectUpdateWriteProcessor] Update ${payload.updateId} already exists`);
      return;
    }

    // Insert the update
    const { error } = await supabase
      .from('project_updates')
      .insert({
        id: payload.updateId,
        fundraiser_id: payload.fundraiserId,
        author_id: payload.authorId,
        title: payload.title,
        body: payload.body,
        milestone_id: payload.milestoneId || null,
        visibility: payload.visibility,
        attachments: payload.attachments || [],
      });

    if (error) throw error;

    console.log(`[ProjectUpdateWriteProcessor] Created update ${payload.updateId}`);
  }
}
