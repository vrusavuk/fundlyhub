/**
 * Payout Request Write Processor
 * Handles payout request lifecycle events following CQRS Write Model pattern
 */

import { EventHandler } from '../types';
import {
  PayoutRequestedEvent,
  PayoutApprovedEvent,
  PayoutDeniedEvent,
  PayoutProcessingEvent,
  PayoutCompletedEvent,
  PayoutFailedEvent,
  PayoutCancelledEvent,
  PayoutInfoRequiredEvent,
} from '../domain/PayoutEvents';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/services/logger.service';
import { eventIdempotency } from '../EventIdempotency';

/**
 * Processor for payout.requested events
 * Creates initial payout request record
 */
export class PayoutRequestedProcessor implements EventHandler<PayoutRequestedEvent> {
  readonly eventType = 'payout.requested';

  async handle(event: PayoutRequestedEvent): Promise<void> {
    const processorName = 'PayoutRequestedProcessor';
    
    // Check idempotency
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) {
      logger.info('Event already processed, skipping', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { eventId: event.id },
      });
      return;
    }

    try {
      const { payload } = event;

      // Insert payout request record - let database generate ID
      const { data: insertedRequest, error } = await supabase
        .from('payout_requests')
        .insert([{
          user_id: payload.userId,
          fundraiser_id: payload.fundraiserId,
          bank_account_id: payload.bankAccountId,
          requested_amount_str: payload.amountStr,
          net_amount_str: payload.amountStr,
          fee_amount_str: '0',
          currency: payload.currency,
          creator_notes: payload.creatorNotes,
          is_first_payout: payload.isFirstPayout,
          status: 'pending',
          correlation_id: event.correlationId,
        }])
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create payout request: ${error.message}`);
      }

      const actualRequestId = insertedRequest.id;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _actor_id: payload.userId,
        _action: 'payout_requested',
        _resource_type: 'payout_request',
        _resource_id: actualRequestId,
        _metadata: {
          amount: payload.amountStr,
          currency: payload.currency,
          fundraiser_id: payload.fundraiserId,
          risk_score: payload.riskScore,
          is_first_payout: payload.isFirstPayout,
        },
      });

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout request created successfully', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.requested event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.approved events
 */
export class PayoutApprovedProcessor implements EventHandler<PayoutApprovedEvent> {
  readonly eventType = 'payout.approved';

  async handle(event: PayoutApprovedEvent): Promise<void> {
    const processorName = 'PayoutApprovedProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'approved',
          approved_by: payload.approvedBy,
          approved_at: payload.approvedAt,
          admin_notes: payload.adminNotes,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to approve payout: ${error.message}`);

      await supabase.rpc('log_audit_event', {
        _actor_id: payload.approvedBy,
        _action: 'payout_approved',
        _resource_type: 'payout_request',
        _resource_id: payload.requestId,
        _metadata: { admin_notes: payload.adminNotes },
      });

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout approved', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.approved event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.denied events
 */
export class PayoutDeniedProcessor implements EventHandler<PayoutDeniedEvent> {
  readonly eventType = 'payout.denied';

  async handle(event: PayoutDeniedEvent): Promise<void> {
    const processorName = 'PayoutDeniedProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'denied',
          denied_by: payload.deniedBy,
          denied_at: payload.deniedAt,
          denial_reason: payload.denialReason,
          admin_notes: payload.adminNotes,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to deny payout: ${error.message}`);

      await supabase.rpc('log_audit_event', {
        _actor_id: payload.deniedBy,
        _action: 'payout_denied',
        _resource_type: 'payout_request',
        _resource_id: payload.requestId,
        _metadata: {
          denial_reason: payload.denialReason,
          admin_notes: payload.adminNotes,
        },
      });

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout denied', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.denied event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.processing events
 */
export class PayoutProcessingProcessor implements EventHandler<PayoutProcessingEvent> {
  readonly eventType = 'payout.processing';

  async handle(event: PayoutProcessingEvent): Promise<void> {
    const processorName = 'PayoutProcessingProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'processing',
          stripe_transfer_id: payload.stripeTransferId,
          estimated_arrival_date: payload.estimatedArrivalDate,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to update payout to processing: ${error.message}`);

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout processing', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.processing event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.completed events
 */
export class PayoutCompletedProcessor implements EventHandler<PayoutCompletedEvent> {
  readonly eventType = 'payout.completed';

  async handle(event: PayoutCompletedEvent): Promise<void> {
    const processorName = 'PayoutCompletedProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      // Update payout request
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .update({
          status: 'completed',
          completed_at: payload.completedAt,
          actual_arrival_date: payload.actualArrivalDate,
          stripe_transfer_id: payload.stripeTransferId,
        })
        .eq('id', payload.requestId)
        .select('user_id, net_amount_str')
        .single();

      if (payoutError) throw new Error(`Failed to complete payout: ${payoutError.message}`);

      // Update tax records
      const taxYear = new Date(payload.completedAt).getFullYear();
      await supabase.rpc('update_tax_records', {
        _user_id: payoutData.user_id,
        _payout_amount: payoutData.net_amount_str,
        _tax_year: taxYear,
      });

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout completed', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.completed event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.failed events
 */
export class PayoutFailedProcessor implements EventHandler<PayoutFailedEvent> {
  readonly eventType = 'payout.failed';

  async handle(event: PayoutFailedEvent): Promise<void> {
    const processorName = 'PayoutFailedProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'failed',
          failed_at: payload.failedAt,
          failure_reason: payload.failureReason,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to mark payout as failed: ${error.message}`);

      await eventIdempotency.markComplete(event.id, processorName);

      logger.error('Payout failed', new Error(payload.failureReason), {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId, isRetryable: payload.isRetryable },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.failed event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.cancelled events
 */
export class PayoutCancelledProcessor implements EventHandler<PayoutCancelledEvent> {
  readonly eventType = 'payout.cancelled';

  async handle(event: PayoutCancelledEvent): Promise<void> {
    const processorName = 'PayoutCancelledProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {

      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'cancelled',
          cancelled_at: payload.cancelledAt,
          cancellation_reason: payload.cancellationReason,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to cancel payout: ${error.message}`);

      await supabase.rpc('log_audit_event', {
        _actor_id: payload.cancelledBy,
        _action: 'payout_cancelled',
        _resource_type: 'payout_request',
        _resource_id: payload.requestId,
        _metadata: { cancellation_reason: payload.cancellationReason },
      });

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout cancelled', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.cancelled event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}

/**
 * Processor for payout.info_required events
 */
export class PayoutInfoRequiredProcessor implements EventHandler<PayoutInfoRequiredEvent> {
  readonly eventType = 'payout.info_required';

  async handle(event: PayoutInfoRequiredEvent): Promise<void> {
    const processorName = 'PayoutInfoRequiredProcessor';
    
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, processorName);
    if (!shouldProcess) return;

    try {
      const { payload } = event;

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'info_required',
          info_required_message: payload.message,
        })
        .eq('id', payload.requestId);

      if (error) throw new Error(`Failed to mark payout as info_required: ${error.message}`);

      await eventIdempotency.markComplete(event.id, processorName);

      logger.info('Payout requires additional info', {
        componentName: processorName,
        operationName: 'handle',
        metadata: { requestId: payload.requestId, requiredInfo: payload.requiredInfo },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await eventIdempotency.markFailed(event.id, processorName, errorMessage);
      logger.error('Failed to process payout.info_required event', error as Error, {
        componentName: processorName,
        operationName: 'handle',
      });
      throw error;
    }
  }
}
