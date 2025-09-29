/**
 * Admin Action Domain Events
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { DomainEvent } from '../types';

// ============= Event Schemas =============

export const UserSuspendedSchema = z.object({
  userId: z.string().uuid(),
  suspendedBy: z.string().uuid(),
  reason: z.string(),
  duration: z.number(), // days
  suspendedUntil: z.string(),
});

export const UserUnsuspendedSchema = z.object({
  userId: z.string().uuid(),
  unsuspendedBy: z.string().uuid(),
});

// Removed UserProfileUpdatedSchema - use the one from UserEvents.ts to avoid conflicts

export const UserDeletedSchema = z.object({
  userId: z.string().uuid(),
  deletedBy: z.string().uuid(),
  reason: z.string().optional(),
});

export const UserRoleAssignedSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  roleName: z.string(),
  assignedBy: z.string().uuid(),
  contextType: z.string().optional(),
  contextId: z.string().uuid().optional(),
});

export const UserRoleRevokedSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  roleName: z.string(),
  revokedBy: z.string().uuid(),
});

export const CampaignApprovedSchema = z.object({
  campaignId: z.string().uuid(),
  approvedBy: z.string().uuid(),
});

export const CampaignRejectedSchema = z.object({
  campaignId: z.string().uuid(),
  rejectedBy: z.string().uuid(),
  reason: z.string(),
});

export const CampaignPausedSchema = z.object({
  campaignId: z.string().uuid(),
  pausedBy: z.string().uuid(),
  reason: z.string().optional(),
});

export const CampaignClosedSchema = z.object({
  campaignId: z.string().uuid(),
  closedBy: z.string().uuid(),
  reason: z.string().optional(),
});

// ============= Event Interfaces =============

export interface UserSuspendedEvent extends DomainEvent<z.infer<typeof UserSuspendedSchema>> {
  readonly type: 'admin.user.suspended';
}

export interface UserUnsuspendedEvent extends DomainEvent<z.infer<typeof UserUnsuspendedSchema>> {
  readonly type: 'admin.user.unsuspended';
}

// Removed UserProfileUpdatedEvent - use the one from UserEvents.ts to avoid conflicts

export interface UserDeletedEvent extends DomainEvent<z.infer<typeof UserDeletedSchema>> {
  readonly type: 'admin.user.deleted';
}

export interface UserRoleAssignedEvent extends DomainEvent<z.infer<typeof UserRoleAssignedSchema>> {
  readonly type: 'admin.user.role_assigned';
}

export interface UserRoleRevokedEvent extends DomainEvent<z.infer<typeof UserRoleRevokedSchema>> {
  readonly type: 'admin.user.role_revoked';
}

export interface CampaignApprovedEvent extends DomainEvent<z.infer<typeof CampaignApprovedSchema>> {
  readonly type: 'admin.campaign.approved';
}

export interface CampaignRejectedEvent extends DomainEvent<z.infer<typeof CampaignRejectedSchema>> {
  readonly type: 'admin.campaign.rejected';
}

export interface CampaignPausedEvent extends DomainEvent<z.infer<typeof CampaignPausedSchema>> {
  readonly type: 'admin.campaign.paused';
}

export interface CampaignClosedEvent extends DomainEvent<z.infer<typeof CampaignClosedSchema>> {
  readonly type: 'admin.campaign.closed';
}

// Union type for all admin events
export type AdminEvent =
  | UserSuspendedEvent
  | UserUnsuspendedEvent
  | UserDeletedEvent
  | UserRoleAssignedEvent
  | UserRoleRevokedEvent
  | CampaignApprovedEvent
  | CampaignRejectedEvent
  | CampaignPausedEvent
  | CampaignClosedEvent;

// ============= Event Factory Functions =============

export function createUserSuspendedEvent(
  payload: z.infer<typeof UserSuspendedSchema>,
  correlationId?: string
): UserSuspendedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.user.suspended',
    payload: UserSuspendedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createUserUnsuspendedEvent(
  payload: z.infer<typeof UserUnsuspendedSchema>,
  correlationId?: string
): UserUnsuspendedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.user.unsuspended',
    payload: UserUnsuspendedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

// Removed createUserProfileUpdatedEvent - use the one from UserEvents.ts to avoid conflicts

export function createUserDeletedEvent(
  payload: z.infer<typeof UserDeletedSchema>,
  correlationId?: string
): UserDeletedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.user.deleted',
    payload: UserDeletedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createUserRoleAssignedEvent(
  payload: z.infer<typeof UserRoleAssignedSchema>,
  correlationId?: string
): UserRoleAssignedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.user.role_assigned',
    payload: UserRoleAssignedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createUserRoleRevokedEvent(
  payload: z.infer<typeof UserRoleRevokedSchema>,
  correlationId?: string
): UserRoleRevokedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.user.role_revoked',
    payload: UserRoleRevokedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createCampaignApprovedEvent(
  payload: z.infer<typeof CampaignApprovedSchema>,
  correlationId?: string
): CampaignApprovedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.campaign.approved',
    payload: CampaignApprovedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createCampaignRejectedEvent(
  payload: z.infer<typeof CampaignRejectedSchema>,
  correlationId?: string
): CampaignRejectedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.campaign.rejected',
    payload: CampaignRejectedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createCampaignPausedEvent(
  payload: z.infer<typeof CampaignPausedSchema>,
  correlationId?: string
): CampaignPausedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.campaign.paused',
    payload: CampaignPausedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createCampaignClosedEvent(
  payload: z.infer<typeof CampaignClosedSchema>,
  correlationId?: string
): CampaignClosedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.campaign.closed',
    payload: CampaignClosedSchema.parse(payload),
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}
