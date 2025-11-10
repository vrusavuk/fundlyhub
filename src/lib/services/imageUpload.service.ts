/**
 * Image Upload Service
 * Higher-level service for fundraiser-specific image operations
 * Coordinates with storage service and publishes appropriate events
 */

import { globalEventBus } from '@/lib/events';
import { createImageLinkedToFundraiserEvent } from '@/lib/events/domain/StorageEvents';
import { storageService, type StorageBucket, type UploadResult } from './storage.service';
import { supabase } from '@/integrations/supabase/client';

export interface FundraiserImage {
  id: string;
  fundraiserId?: string;
  userId: string;
  storagePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageType: 'cover' | 'gallery' | 'draft';
  bucket: string;
  width?: number;
  height?: number;
  isOptimized: boolean;
  createdAt: string;
}

export class ImageUploadService {
  /**
   * Upload cover image for fundraiser
   */
  async uploadCoverImage(
    file: File,
    userId: string,
    isDraft: boolean,
    fundraiserId?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const bucket: StorageBucket = isDraft ? 'fundraiser-drafts' : 'fundraiser-images';
    
    return storageService.uploadFile(bucket, file, userId, {
      fundraiserId,
      imageType: isDraft ? 'draft' : 'cover',
      onProgress,
    });
  }

  /**
   * Upload multiple gallery images
   */
  async uploadGalleryImages(
    files: File[],
    userId: string,
    fundraiserId?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await storageService.uploadFile(
        'fundraiser-gallery',
        file,
        userId,
        {
          fundraiserId,
          imageType: 'gallery',
          onProgress: (fileProgress) => {
            const overallProgress = ((i + fileProgress) / totalFiles) * 100;
            onProgress?.(overallProgress);
          },
        }
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Link draft images to fundraiser on publish
   */
  async linkDraftImagesToFundraiser(
    imageIds: string[],
    fundraiserId: string,
    userId: string
  ): Promise<void> {
    // Publish link events for each image (DB update happens in processor)
    for (const imageId of imageIds) {
      const linkEvent = createImageLinkedToFundraiserEvent({
        imageId,
        fundraiserId,
        userId,
        imageType: 'cover', // This should be determined from the image record
      });

      await globalEventBus.publish(linkEvent);
    }
  }

  /**
   * Delete image and cleanup storage
   */
  async deleteImage(imageId: string, userId: string): Promise<void> {
    // Get image details first
    const { data: image, error } = await supabase
      .from('fundraiser_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (error || !image) {
      throw new Error('Image not found');
    }

    // Check permissions
    if (image.user_id !== userId) {
      throw new Error('Unauthorized to delete this image');
    }

    await storageService.deleteFile(
      imageId,
      image.bucket,
      image.storage_path,
      userId,
      'user_deleted'
    );
  }

  /**
   * Get images for fundraiser
   */
  async getFundraiserImages(
    fundraiserId: string,
    type?: 'cover' | 'gallery'
  ): Promise<FundraiserImage[]> {
    let query = supabase
      .from('fundraiser_images')
      .select('*')
      .eq('fundraiser_id', fundraiserId)
      .is('deleted_at', null);

    if (type) {
      query = query.eq('image_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(img => ({
      id: img.id,
      fundraiserId: img.fundraiser_id,
      userId: img.user_id,
      storagePath: img.storage_path,
      publicUrl: img.public_url,
      fileName: img.file_name,
      fileSize: img.file_size,
      mimeType: img.mime_type,
      imageType: img.image_type as 'cover' | 'gallery' | 'draft',
      bucket: img.bucket,
      width: img.width,
      height: img.height,
      isOptimized: img.is_optimized,
      createdAt: img.created_at,
    }));
  }
}

export const imageUploadService = new ImageUploadService();
