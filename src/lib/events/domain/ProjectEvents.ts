/**
 * Project Update Domain Events
 * Events related to project updates (posting updates on fundraisers)
 */

import { z } from 'zod';
import type { DomainEvent } from '../types';

// ============================================================================
// Event Schemas
// ============================================================================

export const ProjectUpdateCreatedSchema = z.object({
  updateId: z.string().uuid(),
  fundraiserId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  milestoneId: z.string().uuid().optional(),
  visibility: z.enum(['public', 'donors_only']),
  attachments: z.array(z.object({
    type: z.enum(['image', 'document']),
    url: z.string().url()
  })).optional(),
  usedAI: z.boolean().optional()
});

export const ProjectUpdateEditedSchema = z.object({
  updateId: z.string().uuid(),
  fundraiserId: z.string().uuid(),
  authorId: z.string().uuid(),
  changes: z.object({
    title: z.string().optional(),
    body: z.string().optional(),
    visibility: z.enum(['public', 'donors_only']).optional()
  })
});

export const ProjectUpdateDeletedSchema = z.object({
  updateId: z.string().uuid(),
  fundraiserId: z.string().uuid(),
  authorId: z.string().uuid()
});

// ============================================================================
// Event Types
// ============================================================================

export type ProjectUpdateCreatedPayload = z.infer<typeof ProjectUpdateCreatedSchema>;
export type ProjectUpdateEditedPayload = z.infer<typeof ProjectUpdateEditedSchema>;
export type ProjectUpdateDeletedPayload = z.infer<typeof ProjectUpdateDeletedSchema>;

export interface ProjectUpdateCreatedEvent extends DomainEvent {
  type: 'project.update.created';
  payload: ProjectUpdateCreatedPayload;
}

export interface ProjectUpdateEditedEvent extends DomainEvent {
  type: 'project.update.edited';
  payload: ProjectUpdateEditedPayload;
}

export interface ProjectUpdateDeletedEvent extends DomainEvent {
  type: 'project.update.deleted';
  payload: ProjectUpdateDeletedPayload;
}

// ============================================================================
// Event Factory Functions
// ============================================================================

export function createProjectUpdateCreatedEvent(
  payload: ProjectUpdateCreatedPayload,
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  }
): ProjectUpdateCreatedEvent {
  const validatedPayload = ProjectUpdateCreatedSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'project.update.created',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: validatedPayload,
    metadata: {
      userId: metadata?.userId || payload.authorId,
    },
  };
}

export function createProjectUpdateEditedEvent(
  payload: ProjectUpdateEditedPayload,
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  }
): ProjectUpdateEditedEvent {
  const validatedPayload = ProjectUpdateEditedSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'project.update.edited',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: validatedPayload,
    metadata: {
      userId: metadata?.userId || payload.authorId,
    },
  };
}

export function createProjectUpdateDeletedEvent(
  payload: ProjectUpdateDeletedPayload,
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  }
): ProjectUpdateDeletedEvent {
  const validatedPayload = ProjectUpdateDeletedSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'project.update.deleted',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId: metadata?.correlationId,
    causationId: metadata?.causationId,
    payload: validatedPayload,
    metadata: {
      userId: metadata?.userId || payload.authorId,
    },
  };
}
