/**
 * Image Analytics Processor
 * Tracks storage usage, upload performance, and image metrics
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { ImageUploadedEvent, ImageDeletedEvent, ImageOptimizedEvent } from '../domain/StorageEvents';
import { eventIdempotency } from '../EventIdempotency';

export class ImageAnalyticsProcessor implements EventHandler {
  readonly eventType = 'storage.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'ImageAnalyticsProcessor'
    );

    if (!shouldProcess) return;

    try {
      if (event.type === 'storage.image.uploaded') {
        await this.trackImageUpload(event as ImageUploadedEvent);
      } else if (event.type === 'storage.image.deleted') {
        await this.trackImageDeletion(event as ImageDeletedEvent);
      } else if (event.type === 'storage.image.optimized') {
        await this.trackImageOptimization(event as ImageOptimizedEvent);
      }

      await eventIdempotency.markComplete(event.id, 'ImageAnalyticsProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'ImageAnalyticsProcessor', errorMessage);
      console.error('[ImageAnalyticsProcessor] Error:', error);
    }
  }

  private async trackImageUpload(event: ImageUploadedEvent): Promise<void> {
    // Track metrics: total uploads, file sizes, mime types
    const { error } = await supabase.from('storage_analytics').insert({
      event_type: 'upload',
      user_id: event.payload.userId,
      file_size: event.payload.fileSize,
      mime_type: event.payload.mimeType,
      bucket: event.payload.bucket,
      image_type: event.payload.imageType,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('[ImageAnalyticsProcessor] Failed to track upload:', error);
    } else {
      console.log(`[ImageAnalyticsProcessor] Tracked upload: ${event.payload.imageId}`);
    }
  }

  private async trackImageDeletion(event: ImageDeletedEvent): Promise<void> {
    // Track deletion metrics
    console.log(`[ImageAnalyticsProcessor] Tracked deletion: ${event.payload.imageId}, reason: ${event.payload.reason}`);
  }

  private async trackImageOptimization(event: ImageOptimizedEvent): Promise<void> {
    // Track optimization savings
    console.log(
      `[ImageAnalyticsProcessor] Tracked optimization: ${event.payload.imageId} saved ${event.payload.compressionRatio}%`
    );
  }
}
