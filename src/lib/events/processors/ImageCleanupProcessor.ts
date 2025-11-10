/**
 * Image Cleanup Processor
 * Handles scheduled cleanup of abandoned draft images
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { DraftImagesCleanupRequestedEvent } from '../domain/StorageEvents';
import { eventIdempotency } from '../EventIdempotency';
import { createImageDeletedEvent } from '../domain/StorageEvents';
import { globalEventBus } from '../index';

export class ImageCleanupProcessor implements EventHandler {
  readonly eventType = 'storage.draft.cleanup_requested';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'ImageCleanupProcessor'
    );

    if (!shouldProcess) return;

    try {
      await this.cleanupAbandonedDrafts(event as DraftImagesCleanupRequestedEvent);
      await eventIdempotency.markComplete(event.id, 'ImageCleanupProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'ImageCleanupProcessor', errorMessage);
      console.error('[ImageCleanupProcessor] Error:', error);
    }
  }

  private async cleanupAbandonedDrafts(event: DraftImagesCleanupRequestedEvent): Promise<void> {
    const { payload } = event;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - payload.olderThanDays);

    // Find abandoned draft images
    const { data: drafts, error } = await supabase
      .from('fundraiser_images')
      .select('id, user_id, storage_path, bucket')
      .eq('image_type', 'draft')
      .is('fundraiser_id', null)
      .lt('created_at', cutoffDate.toISOString())
      .is('deleted_at', null);

    if (error) throw error;

    // Publish deletion events for each image
    for (const draft of drafts || []) {
      const deleteEvent = createImageDeletedEvent(
        {
          imageId: draft.id,
          userId: draft.user_id,
          storagePath: draft.storage_path,
          bucket: draft.bucket,
          reason: 'draft_expired',
        },
        {
          correlationId: event.correlationId,
          causationId: event.id,
        }
      );

      await globalEventBus.publish(deleteEvent);
    }

    console.log(`[ImageCleanupProcessor] Cleaned up ${drafts?.length || 0} abandoned draft images`);
  }
}
