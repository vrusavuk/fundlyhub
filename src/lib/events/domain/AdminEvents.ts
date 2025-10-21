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

// Role CRUD Events
export const RoleCreatedSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  hierarchyLevel: z.number(),
  isSystemRole: z.boolean(),
  createdBy: z.string().uuid(),
});

export const RoleUpdatedSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  hierarchyLevel: z.number().optional(),
  updatedBy: z.string().uuid(),
  changes: z.record(z.any()),
});

export const RoleDeletedSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
  deletedBy: z.string().uuid(),
  reason: z.string().optional(),
});

export const RolePermissionsUpdatedSchema = z.object({
  roleId: z.string().uuid(),
  roleName: z.string(),
  addedPermissions: z.array(z.string()),
  removedPermissions: z.array(z.string()),
  updatedBy: z.string().uuid(),
});

// Permission CRUD Events
export const PermissionCreatedSchema = z.object({
  permissionId: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  category: z.string(),
  createdBy: z.string().uuid(),
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

// Role Management Event Interfaces
export interface RoleCreatedEvent extends DomainEvent<z.infer<typeof RoleCreatedSchema>> {
  readonly type: 'admin.role.created';
}

export interface RoleUpdatedEvent extends DomainEvent<z.infer<typeof RoleUpdatedSchema>> {
  readonly type: 'admin.role.updated';
}

export interface RoleDeletedEvent extends DomainEvent<z.infer<typeof RoleDeletedSchema>> {
  readonly type: 'admin.role.deleted';
}

export interface RolePermissionsUpdatedEvent extends DomainEvent<z.infer<typeof RolePermissionsUpdatedSchema>> {
  readonly type: 'admin.role.permissions_updated';
}

export interface PermissionCreatedEvent extends DomainEvent<z.infer<typeof PermissionCreatedSchema>> {
  readonly type: 'admin.permission.created';
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
  | CampaignClosedEvent
  | RoleCreatedEvent
  | RoleUpdatedEvent
  | RoleDeletedEvent
  | RolePermissionsUpdatedEvent
  | PermissionCreatedEvent;

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

// Role Management Event Factory Functions
export function createRoleCreatedEvent(
  payload: z.infer<typeof RoleCreatedSchema>,
  correlationId?: string
): RoleCreatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.role.created',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: RoleCreatedSchema.parse(payload),
  };
}

export function createRoleUpdatedEvent(
  payload: z.infer<typeof RoleUpdatedSchema>,
  correlationId?: string
): RoleUpdatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.role.updated',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: RoleUpdatedSchema.parse(payload),
  };
}

export function createRoleDeletedEvent(
  payload: z.infer<typeof RoleDeletedSchema>,
  correlationId?: string
): RoleDeletedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.role.deleted',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: RoleDeletedSchema.parse(payload),
  };
}

export function createRolePermissionsUpdatedEvent(
  payload: z.infer<typeof RolePermissionsUpdatedSchema>,
  correlationId?: string
): RolePermissionsUpdatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.role.permissions_updated',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: RolePermissionsUpdatedSchema.parse(payload),
  };
}

export function createPermissionCreatedEvent(
  payload: z.infer<typeof PermissionCreatedSchema>,
  correlationId?: string
): PermissionCreatedEvent {
  return {
    id: crypto.randomUUID(),
    type: 'admin.permission.created',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: PermissionCreatedSchema.parse(payload),
  };
}
