/**
 * User Domain Events
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { DomainEvent } from '../types';

// User event schemas for validation
export const UserRegisteredSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['visitor', 'donor', 'organizer', 'admin']).optional(),
  registrationMethod: z.enum(['email', 'google', 'facebook']).optional(),
});

export const UserLoggedInSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number(),
});

export const UserProfileUpdatedSchema = z.object({
  userId: z.string().uuid(),
  changes: z.record(z.any()),
  previousValues: z.record(z.any()).optional(),
});

export const UserFollowedCampaignSchema = z.object({
  userId: z.string().uuid(),
  campaignId: z.string().uuid(),
  followType: z.enum(['user', 'organization']),
});

// User event type definitions
export interface UserRegisteredEvent extends DomainEvent<z.infer<typeof UserRegisteredSchema>> {
  type: 'user.registered';
}

export interface UserLoggedInEvent extends DomainEvent<z.infer<typeof UserLoggedInSchema>> {
  type: 'user.logged_in';
}

export interface UserProfileUpdatedEvent extends DomainEvent<z.infer<typeof UserProfileUpdatedSchema>> {
  type: 'user.profile_updated';
}

export interface UserFollowedCampaignEvent extends DomainEvent<z.infer<typeof UserFollowedCampaignSchema>> {
  type: 'user.followed_campaign';
}

export interface UserUnfollowedCampaignEvent extends DomainEvent<z.infer<typeof UserFollowedCampaignSchema>> {
  type: 'user.unfollowed_campaign';
}

// User event union type
// Follow/Unfollow User Events
export const UserFollowedUserSchema = z.object({
  followerId: z.string().uuid(),
  followedUserId: z.string().uuid(),
  followerEmail: z.string().email().optional(),
  followedUserEmail: z.string().email().optional(),
});

export const UserUnfollowedUserSchema = z.object({
  followerId: z.string().uuid(),
  unfollowedUserId: z.string().uuid(),
});

// Follow/Unfollow Organization Events
export const UserFollowedOrganizationSchema = z.object({
  followerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  organizationName: z.string().optional(),
});

export const UserUnfollowedOrganizationSchema = z.object({
  followerId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export interface UserFollowedUserEvent extends DomainEvent<z.infer<typeof UserFollowedUserSchema>> {
  type: 'user.followed_user';
}

export interface UserUnfollowedUserEvent extends DomainEvent<z.infer<typeof UserUnfollowedUserSchema>> {
  type: 'user.unfollowed_user';
}

export interface UserFollowedOrganizationEvent extends DomainEvent<z.infer<typeof UserFollowedOrganizationSchema>> {
  type: 'user.followed_organization';
}

export interface UserUnfollowedOrganizationEvent extends DomainEvent<z.infer<typeof UserUnfollowedOrganizationSchema>> {
  type: 'user.unfollowed_organization';
}

export type UserEvent =
  | UserRegisteredEvent
  | UserLoggedInEvent
  | UserProfileUpdatedEvent
  | UserFollowedCampaignEvent
  | UserUnfollowedCampaignEvent
  | UserFollowedUserEvent
  | UserUnfollowedUserEvent
  | UserFollowedOrganizationEvent
  | UserUnfollowedOrganizationEvent;

// Event factory functions
export const createUserRegisteredEvent = (
  payload: z.infer<typeof UserRegisteredSchema>,
  correlationId?: string
): UserRegisteredEvent => ({
  id: crypto.randomUUID(),
  type: 'user.registered',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: UserRegisteredSchema.parse(payload),
});

export const createUserLoggedInEvent = (
  payload: z.infer<typeof UserLoggedInSchema>,
  correlationId?: string
): UserLoggedInEvent => ({
  id: crypto.randomUUID(),
  type: 'user.logged_in',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: UserLoggedInSchema.parse(payload),
});

export const createUserProfileUpdatedEvent = (
  payload: z.infer<typeof UserProfileUpdatedSchema>,
  correlationId?: string
): UserProfileUpdatedEvent => ({
  id: crypto.randomUUID(),
  type: 'user.profile_updated',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: UserProfileUpdatedSchema.parse(payload),
});

export const createUserFollowedCampaignEvent = (
  payload: z.infer<typeof UserFollowedCampaignSchema>,
  correlationId?: string
): UserFollowedCampaignEvent => ({
  id: crypto.randomUUID(),
  type: 'user.followed_campaign',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: UserFollowedCampaignSchema.parse(payload),
});

export const createUserUnfollowedCampaignEvent = (
  payload: z.infer<typeof UserFollowedCampaignSchema>,
  correlationId?: string
): UserUnfollowedCampaignEvent => ({
  id: crypto.randomUUID(),
  type: 'user.unfollowed_campaign',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: UserFollowedCampaignSchema.parse(payload),
});

/**
 * Factory: User Followed User Event
 */
export function createUserFollowedUserEvent(
  payload: z.infer<typeof UserFollowedUserSchema>,
  correlationId?: string
): UserFollowedUserEvent {
  return {
    id: crypto.randomUUID(),
    type: 'user.followed_user',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: UserFollowedUserSchema.parse(payload),
  };
}

/**
 * Factory: User Unfollowed User Event
 */
export function createUserUnfollowedUserEvent(
  payload: z.infer<typeof UserUnfollowedUserSchema>,
  correlationId?: string
): UserUnfollowedUserEvent {
  return {
    id: crypto.randomUUID(),
    type: 'user.unfollowed_user',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: UserUnfollowedUserSchema.parse(payload),
  };
}

/**
 * Factory: User Followed Organization Event
 */
export function createUserFollowedOrganizationEvent(
  payload: z.infer<typeof UserFollowedOrganizationSchema>,
  correlationId?: string
): UserFollowedOrganizationEvent {
  return {
    id: crypto.randomUUID(),
    type: 'user.followed_organization',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: UserFollowedOrganizationSchema.parse(payload),
  };
}

/**
 * Factory: User Unfollowed Organization Event
 */
export function createUserUnfollowedOrganizationEvent(
  payload: z.infer<typeof UserUnfollowedOrganizationSchema>,
  correlationId?: string
): UserUnfollowedOrganizationEvent {
  return {
    id: crypto.randomUUID(),
    type: 'user.unfollowed_organization',
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
    payload: UserUnfollowedOrganizationSchema.parse(payload),
  };
}