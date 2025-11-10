/**
 * Storage Service
 * Centralized storage operations with retry logic and error handling
 * Publishes events for all storage operations following pub/sub architecture
 */

import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import { createImageUploadedEvent, createImageDeletedEvent } from '@/lib/events/domain/StorageEvents';

export type StorageBucket = 'fundraiser-images' | 'fundraiser-gallery' | 'fundraiser-drafts';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  fundraiserId?: string;
  imageType?: 'cover' | 'gallery' | 'draft';
}

export interface UploadResult {
  url: string;
  path: string;
  imageId: string;
}

export class StorageService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly MAX_RETRIES = 3;

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit` };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not allowed. Please upload JPG, PNG, WebP, or GIF' };
    }

    return { valid: true };
  }

  /**
   * Upload file with automatic retry and progress tracking
   */
  async uploadFile(
    bucket: StorageBucket,
    file: File,
    userId: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Validation
    const validation = this.validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    // Generate unique image ID and path
    const imageId = crypto.randomUUID();
    const filePath = this.generateFilePath(userId, file.name);

    // Upload to Supabase Storage with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        // Publish ImageUploaded event (DB write happens in processor)
        const uploadEvent = createImageUploadedEvent({
          imageId,
          userId,
          fundraiserId: options?.fundraiserId,
          storagePath: filePath,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          imageType: options?.imageType || 'draft',
          bucket,
        });

        await globalEventBus.publish(uploadEvent);

        return { url: publicUrl, path: filePath, imageId };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRIES - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Failed to upload file after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  /**
   * Delete file with cascade cleanup
   */
  async deleteFile(
    imageId: string,
    bucket: string,
    path: string,
    userId: string,
    reason: 'user_deleted' | 'fundraiser_deleted' | 'draft_expired' | 'admin_action'
  ): Promise<void> {
    // Delete from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    // Publish ImageDeleted event
    const deleteEvent = createImageDeletedEvent({
      imageId,
      userId,
      storagePath: path,
      bucket,
      reason,
    });

    await globalEventBus.publish(deleteEvent);
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(
    url: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): string {
    if (!options) return url;

    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());

    return `${url}?${params.toString()}`;
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();
    return `${userId}/${timestamp}-${randomStr}.${extension}`;
  }
}

export const storageService = new StorageService();
