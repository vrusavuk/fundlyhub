/**
 * Campaign Domain Events
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { DomainEvent } from '../types';

// Campaign event schemas
export const CampaignCreatedSchema = z.object({
  campaignId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  goalAmount: z.number().positive(),
  categoryId: z.string().uuid(),
  visibility: z.enum(['public', 'private']),
  endDate: z.string().optional(),
});

export const CampaignUpdatedSchema = z.object({
  campaignId: z.string().uuid(),
  userId: z.string().uuid(),
  changes: z.record(z.any()),
  previousValues: z.record(z.any()).optional(),
});

export const CampaignDeletedSchema = z.object({
  campaignId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export const CampaignGoalReachedSchema = z.object({
  campaignId: z.string().uuid(),
  goalAmount: z.number(),
  totalRaised: z.number(),
  donorCount: z.number(),
});

export const CampaignStatusChangedSchema = z.object({
  campaignId: z.string().uuid(),
  previousStatus: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  newStatus: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  reason: z.string().optional(),
});

// Campaign event interfaces
export interface CampaignCreatedEvent extends DomainEvent<z.infer<typeof CampaignCreatedSchema>> {
  type: 'campaign.created';
}

export interface CampaignUpdatedEvent extends DomainEvent<z.infer<typeof CampaignUpdatedSchema>> {
  type: 'campaign.updated';
}

export interface CampaignDeletedEvent extends DomainEvent<z.infer<typeof CampaignDeletedSchema>> {
  type: 'campaign.deleted';
}

export interface CampaignGoalReachedEvent extends DomainEvent<z.infer<typeof CampaignGoalReachedSchema>> {
  type: 'campaign.goal_reached';
}

export interface CampaignStatusChangedEvent extends DomainEvent<z.infer<typeof CampaignStatusChangedSchema>> {
  type: 'campaign.status_changed';
}

// Campaign event union type
export type CampaignEvent = 
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignDeletedEvent
  | CampaignGoalReachedEvent
  | CampaignStatusChangedEvent;

// Event factory functions
export const createCampaignCreatedEvent = (
  payload: z.infer<typeof CampaignCreatedSchema>,
  correlationId?: string
): CampaignCreatedEvent => ({
  id: crypto.randomUUID(),
  type: 'campaign.created',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: CampaignCreatedSchema.parse(payload),
});

export const createCampaignUpdatedEvent = (
  payload: z.infer<typeof CampaignUpdatedSchema>,
  correlationId?: string
): CampaignUpdatedEvent => ({
  id: crypto.randomUUID(),
  type: 'campaign.updated',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: CampaignUpdatedSchema.parse(payload),
});

export const createCampaignDeletedEvent = (
  payload: z.infer<typeof CampaignDeletedSchema>,
  correlationId?: string
): CampaignDeletedEvent => ({
  id: crypto.randomUUID(),
  type: 'campaign.deleted',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: CampaignDeletedSchema.parse(payload),
});

export const createCampaignGoalReachedEvent = (
  payload: z.infer<typeof CampaignGoalReachedSchema>,
  correlationId?: string
): CampaignGoalReachedEvent => ({
  id: crypto.randomUUID(),
  type: 'campaign.goal_reached',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: CampaignGoalReachedSchema.parse(payload),
});

export const createCampaignStatusChangedEvent = (
  payload: z.infer<typeof CampaignStatusChangedSchema>,
  correlationId?: string
): CampaignStatusChangedEvent => ({
  id: crypto.randomUUID(),
  type: 'campaign.status_changed',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: CampaignStatusChangedSchema.parse(payload),
});