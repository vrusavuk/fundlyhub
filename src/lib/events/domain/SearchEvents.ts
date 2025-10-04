/**
 * Search Domain Events
 * Following CQRS pattern for search operations
 */

import { z } from 'zod';
import type { DomainEvent } from '../types';

// =====================================================
// EVENT SCHEMAS
// =====================================================

export const SearchQuerySubmittedPayloadSchema = z.object({
  query: z.string().min(1),
  userId: z.string().uuid().optional(),
  filters: z.object({
    type: z.enum(['all', 'campaign', 'user', 'organization']).optional(),
    category: z.string().uuid().optional(),
  }).optional(),
  sessionId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

export const SearchResultsProjectedPayloadSchema = z.object({
  query: z.string(),
  results: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['campaign', 'user', 'organization']),
    title: z.string(),
    subtitle: z.string().optional(),
    image: z.string().optional(),
    snippet: z.string().optional(),
    link: z.string(),
    relevanceScore: z.number().optional(),
    matchType: z.string().optional(),
  })),
  resultCount: z.number(),
  executionTimeMs: z.number().optional(),
  cached: z.boolean().optional(),
});

export const SearchSuggestionGeneratedPayloadSchema = z.object({
  originalQuery: z.string(),
  suggestions: z.array(z.object({
    suggestion: z.string(),
    matchType: z.enum(['typo', 'phonetic', 'transposition', 'abbreviation', 'similar']),
    relevanceScore: z.number(),
    resultCount: z.number().optional(),
  })),
  strategy: z.string().optional(),
});

export const UserProfileProjectionUpdatedPayloadSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  role: z.string(),
  profileVisibility: z.string(),
  accountStatus: z.string(),
  isVerified: z.boolean().optional(),
  followerCount: z.number().optional(),
  campaignCount: z.number().optional(),
  updateType: z.enum(['created', 'updated', 'deleted']),
});

export const SearchAnalyticsRecordedPayloadSchema = z.object({
  query: z.string(),
  resultCount: z.number(),
  clickedResultId: z.string().uuid().optional(),
  clickedResultType: z.string().optional(),
  suggestionClicked: z.boolean().optional(),
  suggestionQuery: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  executionTimeMs: z.number().optional(),
});

// =====================================================
// EVENT INTERFACES
// =====================================================

export interface SearchQuerySubmittedEvent extends DomainEvent {
  type: 'search.query.submitted';
  payload: z.infer<typeof SearchQuerySubmittedPayloadSchema>;
}

export interface SearchResultsProjectedEvent extends DomainEvent {
  type: 'search.results.projected';
  payload: z.infer<typeof SearchResultsProjectedPayloadSchema>;
}

export interface SearchSuggestionGeneratedEvent extends DomainEvent {
  type: 'search.suggestion.generated';
  payload: z.infer<typeof SearchSuggestionGeneratedPayloadSchema>;
}

export interface UserProfileProjectionUpdatedEvent extends DomainEvent {
  type: 'search.user_projection.updated';
  payload: z.infer<typeof UserProfileProjectionUpdatedPayloadSchema>;
}

export interface SearchAnalyticsRecordedEvent extends DomainEvent {
  type: 'search.analytics.recorded';
  payload: z.infer<typeof SearchAnalyticsRecordedPayloadSchema>;
}

export type SearchEvent =
  | SearchQuerySubmittedEvent
  | SearchResultsProjectedEvent
  | SearchSuggestionGeneratedEvent
  | UserProfileProjectionUpdatedEvent
  | SearchAnalyticsRecordedEvent;

// =====================================================
// EVENT FACTORY FUNCTIONS
// =====================================================

export function createSearchQuerySubmittedEvent(
  payload: z.infer<typeof SearchQuerySubmittedPayloadSchema>,
  correlationId?: string
): SearchQuerySubmittedEvent {
  const validated = SearchQuerySubmittedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'search.query.submitted',
    payload: validated,
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createSearchResultsProjectedEvent(
  payload: z.infer<typeof SearchResultsProjectedPayloadSchema>,
  correlationId?: string
): SearchResultsProjectedEvent {
  const validated = SearchResultsProjectedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'search.results.projected',
    payload: validated,
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createSearchSuggestionGeneratedEvent(
  payload: z.infer<typeof SearchSuggestionGeneratedPayloadSchema>,
  correlationId?: string
): SearchSuggestionGeneratedEvent {
  const validated = SearchSuggestionGeneratedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'search.suggestion.generated',
    payload: validated,
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createUserProfileProjectionUpdatedEvent(
  payload: z.infer<typeof UserProfileProjectionUpdatedPayloadSchema>,
  correlationId?: string
): UserProfileProjectionUpdatedEvent {
  const validated = UserProfileProjectionUpdatedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'search.user_projection.updated',
    payload: validated,
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}

export function createSearchAnalyticsRecordedEvent(
  payload: z.infer<typeof SearchAnalyticsRecordedPayloadSchema>,
  correlationId?: string
): SearchAnalyticsRecordedEvent {
  const validated = SearchAnalyticsRecordedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'search.analytics.recorded',
    payload: validated,
    timestamp: Date.now(),
    version: '1.0.0',
    correlationId,
  };
}
