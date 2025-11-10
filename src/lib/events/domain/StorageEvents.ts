/**
 * Storage/Image Domain Events
 * Events related to file uploads, image management, and storage operations
 */

import { z } from 'zod';
import type { DomainEvent } from '../types';

// ============================================================================
// Event Schemas
// ============================================================================

export const ImageUploadedSchema = z.object({
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  fundraiserId: z.string().uuid().optional(), // null for drafts
  storagePath: z.string(),
  publicUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  imageType: z.enum(['cover', 'gallery', 'draft']),
  bucket: z.enum(['fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts']),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const ImageDeletedSchema = z.object({
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  storagePath: z.string(),
  bucket: z.string(),
  reason: z.enum(['user_deleted', 'fundraiser_deleted', 'draft_expired', 'admin_action']),
});

export const ImageLinkedToFundraiserSchema = z.object({
  imageId: z.string().uuid(),
  fundraiserId: z.string().uuid(),
  userId: z.string().uuid(),
  imageType: z.enum(['cover', 'gallery']),
  previousFundraiserId: z.string().uuid().optional(),
});

export const ImageOptimizedSchema = z.object({
  imageId: z.string().uuid(),
  originalSize: z.number(),
  optimizedSize: z.number(),
  compressionRatio: z.number(),
  format: z.enum(['webp', 'jpeg', 'png']),
  optimizedUrl: z.string().url(),
});

export const DraftImagesCleanupRequestedSchema = z.object({
  userId: z.string().uuid().optional(),
  olderThanDays: z.number(),
  estimatedCount: z.number().optional(),
});

// ============================================================================
// Event Interfaces
// ============================================================================

export interface ImageUploadedEvent extends DomainEvent {
  type: 'storage.image.uploaded';
  payload: z.infer<typeof ImageUploadedSchema>;
}

export interface ImageDeletedEvent extends DomainEvent {
  type: 'storage.image.deleted';
  payload: z.infer<typeof ImageDeletedSchema>;
}

export interface ImageLinkedToFundraiserEvent extends DomainEvent {
  type: 'storage.image.linked';
  payload: z.infer<typeof ImageLinkedToFundraiserSchema>;
}

export interface ImageOptimizedEvent extends DomainEvent {
  type: 'storage.image.optimized';
  payload: z.infer<typeof ImageOptimizedSchema>;
}

export interface DraftImagesCleanupRequestedEvent extends DomainEvent {
  type: 'storage.draft.cleanup_requested';
  payload: z.infer<typeof DraftImagesCleanupRequestedSchema>;
}

export type StorageEvent =
  | ImageUploadedEvent
  | ImageDeletedEvent
  | ImageLinkedToFundraiserEvent
  | ImageOptimizedEvent
  | DraftImagesCleanupRequestedEvent;

// ============================================================================
// Event Factory Functions
// ============================================================================

export function createImageUploadedEvent(
  payload: z.infer<typeof ImageUploadedSchema>,
  metadata?: {
    correlationId?: string;
    causationId?: string;
  }
): ImageUploadedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'storage.image.uploaded',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: ImageUploadedSchema.parse(payload),
    metadata: {
      userId: payload.userId,
    },
  };
}

export function createImageDeletedEvent(
  payload: z.infer<typeof ImageDeletedSchema>,
  metadata?: {
    correlationId?: string;
    causationId?: string;
  }
): ImageDeletedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'storage.image.deleted',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: ImageDeletedSchema.parse(payload),
    metadata: {
      userId: payload.userId,
    },
  };
}

export function createImageLinkedToFundraiserEvent(
  payload: z.infer<typeof ImageLinkedToFundraiserSchema>,
  metadata?: {
    correlationId?: string;
    causationId?: string;
  }
): ImageLinkedToFundraiserEvent {
  return {
    id: crypto.randomUUID(),
    type: 'storage.image.linked',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: ImageLinkedToFundraiserSchema.parse(payload),
    metadata: {
      userId: payload.userId,
    },
  };
}

export function createImageOptimizedEvent(
  payload: z.infer<typeof ImageOptimizedSchema>,
  metadata?: {
    correlationId?: string;
    causationId?: string;
  }
): ImageOptimizedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'storage.image.optimized',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: ImageOptimizedSchema.parse(payload),
  };
}

export function createDraftImagesCleanupRequestedEvent(
  payload: z.infer<typeof DraftImagesCleanupRequestedSchema>,
  metadata?: {
    correlationId?: string;
    causationId?: string;
  }
): DraftImagesCleanupRequestedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'storage.draft.cleanup_requested',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: DraftImagesCleanupRequestedSchema.parse(payload),
  };
}
