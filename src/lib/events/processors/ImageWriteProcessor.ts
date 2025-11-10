/**
 * Image Write Processor
 * Handles idempotent writes to fundraiser_images table
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { ImageUploadedEvent, ImageDeletedEvent, ImageLinkedToFundraiserEvent } from '../domain/StorageEvents';
import { eventIdempotency } from '../EventIdempotency';

export class ImageWriteProcessor implements EventHandler {
  readonly eventType = 'storage.image.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'ImageWriteProcessor'
    );

    if (!shouldProcess) {
      console.log(`[ImageWriteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      if (event.type === 'storage.image.uploaded') {
        await this.handleImageUploaded(event as ImageUploadedEvent);
      } else if (event.type === 'storage.image.deleted') {
        await this.handleImageDeleted(event as ImageDeletedEvent);
      } else if (event.type === 'storage.image.linked') {
        await this.handleImageLinked(event as ImageLinkedToFundraiserEvent);
      }

      await eventIdempotency.markComplete(event.id, 'ImageWriteProcessor');
      console.log(`[ImageWriteProcessor] Successfully processed event ${event.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'ImageWriteProcessor', errorMessage);
      console.error(`[ImageWriteProcessor] Failed to process event ${event.id}:`, error);
      throw error;
    }
  }

  private async handleImageUploaded(event: ImageUploadedEvent): Promise<void> {
    const { payload } = event;

    const { error } = await supabase
      .from('fundraiser_images')
      .insert({
        id: payload.imageId,
        fundraiser_id: payload.fundraiserId || null,
        user_id: payload.userId,
        storage_path: payload.storagePath,
        public_url: payload.publicUrl,
        file_name: payload.fileName,
        file_size: payload.fileSize,
        mime_type: payload.mimeType,
        image_type: payload.imageType,
        bucket: payload.bucket,
        width: payload.width,
        height: payload.height,
        is_optimized: false,
      });

    if (error) throw error;

    console.log(`[ImageWriteProcessor] Image metadata saved: ${payload.imageId}`);
  }

  private async handleImageDeleted(event: ImageDeletedEvent): Promise<void> {
    const { payload } = event;

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('fundraiser_images')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', payload.imageId);

    if (error) throw error;

    console.log(`[ImageWriteProcessor] Image marked as deleted: ${payload.imageId}`);
  }

  private async handleImageLinked(event: ImageLinkedToFundraiserEvent): Promise<void> {
    const { payload } = event;

    // Update fundraiser_id and change type from 'draft' to actual type
    const { error } = await supabase
      .from('fundraiser_images')
      .update({
        fundraiser_id: payload.fundraiserId,
        image_type: payload.imageType,
      })
      .eq('id', payload.imageId);

    if (error) throw error;

    console.log(`[ImageWriteProcessor] Image linked to fundraiser: ${payload.imageId} -> ${payload.fundraiserId}`);
  }
}
