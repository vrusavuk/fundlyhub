/**
 * Payout Domain Events
 * Following Event Sourcing and Domain-Driven Design principles
 */

import { z } from 'zod';
import { DomainEvent, EventPayload } from '../types';

// ============================================================================
// Event Payload Schemas (Validation)
// ============================================================================

export const PayoutRequestedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  fundraiserId: z.string().uuid().nullable(),
  bankAccountId: z.string().uuid(),
  amountStr: z.string(),
  currency: z.string(),
  creatorNotes: z.string().optional(),
  isFirstPayout: z.boolean(),
  riskScore: z.number().int().min(0).max(100),
});

export const PayoutApprovedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  adminNotes: z.string().optional(),
  approvedAt: z.string().datetime(),
});

export const PayoutDeniedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  deniedBy: z.string().uuid(),
  denialReason: z.string(),
  adminNotes: z.string().optional(),
  deniedAt: z.string().datetime(),
});

export const PayoutProcessingPayloadSchema = z.object({
  requestId: z.string().uuid(),
  stripeTransferId: z.string().optional(),
  estimatedArrivalDate: z.string().date().optional(),
});

export const PayoutCompletedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  stripeTransferId: z.string(),
  actualArrivalDate: z.string().date(),
  completedAt: z.string().datetime(),
});

export const PayoutFailedPayloadSchema = z.object({
  requestId: z.string().uuid(),
  failureReason: z.string(),
  stripeError: z.string().optional(),
  failedAt: z.string().datetime(),
  isRetryable: z.boolean(),
});

export const PayoutCancelledPayloadSchema = z.object({
  requestId: z.string().uuid(),
  cancelledBy: z.string().uuid(),
  cancellationReason: z.string(),
  cancelledAt: z.string().datetime(),
});

export const PayoutInfoRequiredPayloadSchema = z.object({
  requestId: z.string().uuid(),
  message: z.string(),
  requiredInfo: z.array(z.string()),
});

export const BankAccountVerifiedPayloadSchema = z.object({
  bankAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  verificationMethod: z.string(),
  verifiedAt: z.string().datetime(),
});

export const BankAccountVerificationFailedPayloadSchema = z.object({
  bankAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  failureReason: z.string(),
  attemptCount: z.number().int(),
  canRetry: z.boolean(),
});

// ============================================================================
// Event Type Definitions
// ============================================================================

export type PayoutRequestedPayload = z.infer<typeof PayoutRequestedPayloadSchema>;
export type PayoutApprovedPayload = z.infer<typeof PayoutApprovedPayloadSchema>;
export type PayoutDeniedPayload = z.infer<typeof PayoutDeniedPayloadSchema>;
export type PayoutProcessingPayload = z.infer<typeof PayoutProcessingPayloadSchema>;
export type PayoutCompletedPayload = z.infer<typeof PayoutCompletedPayloadSchema>;
export type PayoutFailedPayload = z.infer<typeof PayoutFailedPayloadSchema>;
export type PayoutCancelledPayload = z.infer<typeof PayoutCancelledPayloadSchema>;
export type PayoutInfoRequiredPayload = z.infer<typeof PayoutInfoRequiredPayloadSchema>;
export type BankAccountVerifiedPayload = z.infer<typeof BankAccountVerifiedPayloadSchema>;
export type BankAccountVerificationFailedPayload = z.infer<typeof BankAccountVerificationFailedPayloadSchema>;

// ============================================================================
// Domain Event Interfaces
// ============================================================================

export interface PayoutRequestedEvent extends DomainEvent<PayoutRequestedPayload> {
  type: 'payout.requested';
}

export interface PayoutApprovedEvent extends DomainEvent<PayoutApprovedPayload> {
  type: 'payout.approved';
}

export interface PayoutDeniedEvent extends DomainEvent<PayoutDeniedPayload> {
  type: 'payout.denied';
}

export interface PayoutProcessingEvent extends DomainEvent<PayoutProcessingPayload> {
  type: 'payout.processing';
}

export interface PayoutCompletedEvent extends DomainEvent<PayoutCompletedPayload> {
  type: 'payout.completed';
}

export interface PayoutFailedEvent extends DomainEvent<PayoutFailedPayload> {
  type: 'payout.failed';
}

export interface PayoutCancelledEvent extends DomainEvent<PayoutCancelledPayload> {
  type: 'payout.cancelled';
}

export interface PayoutInfoRequiredEvent extends DomainEvent<PayoutInfoRequiredPayload> {
  type: 'payout.info_required';
}

export interface BankAccountVerifiedEvent extends DomainEvent<BankAccountVerifiedPayload> {
  type: 'payout.bank_account.verified';
}

export interface BankAccountVerificationFailedEvent extends DomainEvent<BankAccountVerificationFailedPayload> {
  type: 'payout.bank_account.verification_failed';
}

// ============================================================================
// Union Type for All Payout Events
// ============================================================================

export type PayoutEvent =
  | PayoutRequestedEvent
  | PayoutApprovedEvent
  | PayoutDeniedEvent
  | PayoutProcessingEvent
  | PayoutCompletedEvent
  | PayoutFailedEvent
  | PayoutCancelledEvent
  | PayoutInfoRequiredEvent
  | BankAccountVerifiedEvent
  | BankAccountVerificationFailedEvent;

// ============================================================================
// Event Factory Functions
// ============================================================================

export function createPayoutRequestedEvent(
  payload: PayoutRequestedPayload,
  correlationId?: string
): PayoutRequestedEvent {
  PayoutRequestedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.requested',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutApprovedEvent(
  payload: PayoutApprovedPayload,
  correlationId?: string
): PayoutApprovedEvent {
  PayoutApprovedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.approved',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutDeniedEvent(
  payload: PayoutDeniedPayload,
  correlationId?: string
): PayoutDeniedEvent {
  PayoutDeniedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.denied',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutProcessingEvent(
  payload: PayoutProcessingPayload,
  correlationId?: string
): PayoutProcessingEvent {
  PayoutProcessingPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.processing',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutCompletedEvent(
  payload: PayoutCompletedPayload,
  correlationId?: string
): PayoutCompletedEvent {
  PayoutCompletedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.completed',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutFailedEvent(
  payload: PayoutFailedPayload,
  correlationId?: string
): PayoutFailedEvent {
  PayoutFailedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.failed',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutCancelledEvent(
  payload: PayoutCancelledPayload,
  correlationId?: string
): PayoutCancelledEvent {
  PayoutCancelledPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.cancelled',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createPayoutInfoRequiredEvent(
  payload: PayoutInfoRequiredPayload,
  correlationId?: string
): PayoutInfoRequiredEvent {
  PayoutInfoRequiredPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.info_required',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'payout_request',
      aggregateId: payload.requestId,
    },
  };
}

export function createBankAccountVerifiedEvent(
  payload: BankAccountVerifiedPayload,
  correlationId?: string
): BankAccountVerifiedEvent {
  BankAccountVerifiedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.bank_account.verified',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'bank_account',
      aggregateId: payload.bankAccountId,
    },
  };
}

export function createBankAccountVerificationFailedEvent(
  payload: BankAccountVerificationFailedPayload,
  correlationId?: string
): BankAccountVerificationFailedEvent {
  BankAccountVerificationFailedPayloadSchema.parse(payload);
  
  return {
    id: crypto.randomUUID(),
    type: 'payout.bank_account.verification_failed',
    timestamp: Date.now(),
    version: '1.0',
    correlationId,
    payload,
    metadata: {
      source: 'payout-service',
      aggregateType: 'bank_account',
      aggregateId: payload.bankAccountId,
    },
  };
}
