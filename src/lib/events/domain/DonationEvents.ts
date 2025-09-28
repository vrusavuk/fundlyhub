/**
 * Donation Domain Events
 * Following Single Responsibility Principle
 */

import { z } from 'zod';
import { DomainEvent } from '../types';

// Donation event schemas
export const DonationInitiatedSchema = z.object({
  donationId: z.string().uuid(),
  campaignId: z.string().uuid(),
  donorId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.string(),
  isAnonymous: z.boolean().default(false),
  message: z.string().optional(),
});

export const DonationCompletedSchema = z.object({
  donationId: z.string().uuid(),
  campaignId: z.string().uuid(),
  donorId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string(),
  processingFee: z.number().optional(),
  netAmount: z.number().positive(),
  paymentProvider: z.string(),
  transactionId: z.string(),
});

export const DonationFailedSchema = z.object({
  donationId: z.string().uuid(),
  campaignId: z.string().uuid(),
  donorId: z.string().uuid().optional(),
  amount: z.number().positive(),
  reason: z.string(),
  errorCode: z.string().optional(),
  retryable: z.boolean().default(false),
});

export const DonationRefundedSchema = z.object({
  donationId: z.string().uuid(),
  originalAmount: z.number().positive(),
  refundAmount: z.number().positive(),
  reason: z.string(),
  refundTransactionId: z.string(),
  initiatedBy: z.string().uuid(),
});

// Donation event interfaces
export interface DonationInitiatedEvent extends DomainEvent<z.infer<typeof DonationInitiatedSchema>> {
  type: 'donation.initiated';
}

export interface DonationCompletedEvent extends DomainEvent<z.infer<typeof DonationCompletedSchema>> {
  type: 'donation.completed';
}

export interface DonationFailedEvent extends DomainEvent<z.infer<typeof DonationFailedSchema>> {
  type: 'donation.failed';
}

export interface DonationRefundedEvent extends DomainEvent<z.infer<typeof DonationRefundedSchema>> {
  type: 'donation.refunded';
}

// Donation event union type
export type DonationEvent = 
  | DonationInitiatedEvent
  | DonationCompletedEvent
  | DonationFailedEvent
  | DonationRefundedEvent;

// Event factory functions
export const createDonationInitiatedEvent = (
  payload: z.infer<typeof DonationInitiatedSchema>,
  correlationId?: string
): DonationInitiatedEvent => ({
  id: crypto.randomUUID(),
  type: 'donation.initiated',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: DonationInitiatedSchema.parse(payload),
});

export const createDonationCompletedEvent = (
  payload: z.infer<typeof DonationCompletedSchema>,
  correlationId?: string
): DonationCompletedEvent => ({
  id: crypto.randomUUID(),
  type: 'donation.completed',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: DonationCompletedSchema.parse(payload),
});

export const createDonationFailedEvent = (
  payload: z.infer<typeof DonationFailedSchema>,
  correlationId?: string
): DonationFailedEvent => ({
  id: crypto.randomUUID(),
  type: 'donation.failed',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: DonationFailedSchema.parse(payload),
});

export const createDonationRefundedEvent = (
  payload: z.infer<typeof DonationRefundedSchema>,
  correlationId?: string
): DonationRefundedEvent => ({
  id: crypto.randomUUID(),
  type: 'donation.refunded',
  timestamp: Date.now(),
  version: '1.0.0',
  correlationId,
  payload: DonationRefundedSchema.parse(payload),
});