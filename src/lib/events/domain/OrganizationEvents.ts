/**
 * Organization Domain Events
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { DomainEvent } from '../types';

// ============= Event Schemas =============

export const OrganizationCreatedSchema = z.object({
  organizationId: z.string().uuid(),
  legalName: z.string(),
  createdBy: z.string().uuid(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
});

export const OrganizationVerifiedSchema = z.object({
  organizationId: z.string().uuid(),
  verifiedBy: z.string().uuid(),
  verifiedAt: z.number(),
});

export const OrganizationRejectedSchema = z.object({
  organizationId: z.string().uuid(),
  rejectedBy: z.string().uuid(),
  reason: z.string(),
});

export const OrganizationUpdatedSchema = z.object({
  organizationId: z.string().uuid(),
  updatedBy: z.string().uuid(),
  changes: z.record(z.any()),
});

export const OrganizationDeletedSchema = z.object({
  organizationId: z.string().uuid(),
  deletedBy: z.string().uuid(),
  reason: z.string().optional(),
});

// ============= Event Interfaces =============

export interface OrganizationCreatedEvent extends DomainEvent<z.infer<typeof OrganizationCreatedSchema>> {
  readonly type: 'organization.created';
}

export interface OrganizationVerifiedEvent extends DomainEvent<z.infer<typeof OrganizationVerifiedSchema>> {
  readonly type: 'organization.verified';
}

export interface OrganizationRejectedEvent extends DomainEvent<z.infer<typeof OrganizationRejectedSchema>> {
  readonly type: 'organization.rejected';
}

export interface OrganizationUpdatedEvent extends DomainEvent<z.infer<typeof OrganizationUpdatedSchema>> {
  readonly type: 'organization.updated';
}

export interface OrganizationDeletedEvent extends DomainEvent<z.infer<typeof OrganizationDeletedSchema>> {
  readonly type: 'organization.deleted';
}

// Union type for all organization events
export type OrganizationEvent =
  | OrganizationCreatedEvent
  | OrganizationVerifiedEvent
  | OrganizationRejectedEvent
  | OrganizationUpdatedEvent
  | OrganizationDeletedEvent;

// ============= Event Factory Functions =============

export function createOrganizationCreatedEvent(
  payload: z.infer<typeof OrganizationCreatedSchema>,
  correlationId?: string
): OrganizationCreatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'organization.created',
    payload: OrganizationCreatedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createOrganizationVerifiedEvent(
  payload: z.infer<typeof OrganizationVerifiedSchema>,
  correlationId?: string
): OrganizationVerifiedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'organization.verified',
    payload: OrganizationVerifiedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createOrganizationRejectedEvent(
  payload: z.infer<typeof OrganizationRejectedSchema>,
  correlationId?: string
): OrganizationRejectedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'organization.rejected',
    payload: OrganizationRejectedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createOrganizationUpdatedEvent(
  payload: z.infer<typeof OrganizationUpdatedSchema>,
  correlationId?: string
): OrganizationUpdatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'organization.updated',
    payload: OrganizationUpdatedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createOrganizationDeletedEvent(
  payload: z.infer<typeof OrganizationDeletedSchema>,
  correlationId?: string
): OrganizationDeletedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'organization.deleted',
    payload: OrganizationDeletedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}
