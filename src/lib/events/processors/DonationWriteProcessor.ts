import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { 
  DonationCompletedEvent, 
  DonationRefundedEvent,
  DonationFailedEvent 
} from '../domain/DonationEvents';
import { eventIdempotency } from '../EventIdempotency';

export class DonationWriteProcessor implements EventHandler {
  readonly eventType = 'donation.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id, 
      'DonationWriteProcessor'
    );
    
    if (!shouldProcess) {
      console.log(`[DonationWriteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      switch (event.type) {
        case 'donation.completed':
          await this.handleDonationCompleted(event as DonationCompletedEvent);
          break;
        case 'donation.refunded':
          await this.handleDonationRefunded(event as DonationRefundedEvent);
          break;
        case 'donation.failed':
          await this.handleDonationFailed(event as DonationFailedEvent);
          break;
      }

      await eventIdempotency.markComplete(event.id, 'DonationWriteProcessor');
      console.log(`[DonationWriteProcessor] Processed ${event.type}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'DonationWriteProcessor', errorMessage);
      console.error('[DonationWriteProcessor] Error:', error);
      throw error;
    }
  }

  private async handleDonationCompleted(event: DonationCompletedEvent): Promise<void> {
    const { donationId, campaignId, donorId, amount } = event.payload;

    // Log audit event
    await supabase.rpc('log_audit_event', {
      _actor_id: donorId || null,
      _action: 'donation_completed',
      _resource_type: 'donation',
      _resource_id: donationId,
      _metadata: {
        campaign_id: campaignId,
        amount,
        payment_provider: event.payload.paymentProvider,
      },
    });

    // Notification service should already be subscribed to these events
    console.log('[DonationWriteProcessor] Donation completed, notifications should be sent');
  }

  private async handleDonationRefunded(event: DonationRefundedEvent): Promise<void> {
    const { donationId, refundAmount, reason } = event.payload;

    // Log refund in audit
    await supabase.rpc('log_audit_event', {
      _actor_id: event.payload.initiatedBy || null,
      _action: 'donation_refunded',
      _resource_type: 'donation',
      _resource_id: donationId,
      _metadata: {
        refund_amount: refundAmount,
        reason,
        refund_transaction_id: event.payload.refundTransactionId,
      },
    });

    console.log('[DonationWriteProcessor] Donation refunded, owner should be notified');
  }

  private async handleDonationFailed(event: DonationFailedEvent): Promise<void> {
    const { donationId, campaignId, reason, retryable } = event.payload;

    // Log failed payment
    await supabase.rpc('log_audit_event', {
      _actor_id: event.payload.donorId || null,
      _action: 'donation_failed',
      _resource_type: 'donation',
      _resource_id: donationId,
      _metadata: {
        campaign_id: campaignId,
        reason,
        retryable,
        error_code: event.payload.errorCode,
      },
    });

    if (retryable) {
      console.log('[DonationWriteProcessor] Payment failed but retryable');
    }
  }
}
