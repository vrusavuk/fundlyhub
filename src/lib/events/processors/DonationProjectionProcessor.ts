import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { 
  DonationCompletedEvent, 
  DonationRefundedEvent,
  DonationFailedEvent 
} from '../domain/DonationEvents';
import { eventIdempotency } from '../EventIdempotency';

export class DonationProjectionProcessor implements EventHandler {
  readonly eventType = 'donation.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id, 
      'DonationProjectionProcessor'
    );
    
    if (!shouldProcess) {
      console.log(`[DonationProjectionProcessor] Skipping duplicate event ${event.id}`);
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

      await eventIdempotency.markComplete(event.id, 'DonationProjectionProcessor');
      console.log(`[DonationProjectionProcessor] Processed ${event.type}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'DonationProjectionProcessor', errorMessage);
      console.error('[DonationProjectionProcessor] Error:', error);
      throw error;
    }
  }

  private async handleDonationCompleted(event: DonationCompletedEvent): Promise<void> {
    const { campaignId, donorId, amount } = event.payload;

    // Update campaign analytics projection (uses advisory lock for safety)
    if (campaignId) {
      const { error: analyticsError } = await supabase.rpc('update_campaign_analytics_safe', {
        p_campaign_id: campaignId,
        p_amount: amount,
        p_donor_id: donorId || null,
      });

      if (analyticsError) {
        console.error('[DonationProjectionProcessor] Campaign analytics error:', analyticsError);
      }
    }

    // Update donor history projection
    if (donorId) {
      const { error: donorError } = await supabase.rpc('update_donor_history_safe', {
        p_user_id: donorId,
        p_amount: amount,
        p_campaign_id: campaignId,
      });

      if (donorError) {
        console.error('[DonationProjectionProcessor] Donor history error:', donorError);
      }
    }

    // Invalidate admin cache so donation appears in admin panel
    const { adminDataService } = await import('@/lib/services/AdminDataService');
    adminDataService.invalidateCache('donations');
  }

  private async handleDonationRefunded(event: DonationRefundedEvent): Promise<void> {
    const { donationId, refundAmount } = event.payload;

    // Fetch donation to get campaign and donor info
    const { data: donation } = await supabase
      .from('donations')
      .select('fundraiser_id, donor_user_id')
      .eq('id', donationId)
      .single();

    if (!donation) {
      console.error('[DonationProjectionProcessor] Donation not found for refund');
      return;
    }

    // Revert campaign analytics (subtract refunded amount)
    if (donation.fundraiser_id) {
      const { error: analyticsError } = await supabase.rpc('update_campaign_analytics_safe', {
        p_campaign_id: donation.fundraiser_id,
        p_amount: -refundAmount, // Negative to subtract
        p_donor_id: donation.donor_user_id,
      });

      if (analyticsError) {
        console.error('[DonationProjectionProcessor] Campaign analytics revert error:', analyticsError);
      }
    }

    // Revert donor history
    if (donation.donor_user_id) {
      const { error: donorError } = await supabase.rpc('update_donor_history_safe', {
        p_user_id: donation.donor_user_id,
        p_amount: -refundAmount, // Negative to subtract
        p_campaign_id: donation.fundraiser_id,
      });

      if (donorError) {
        console.error('[DonationProjectionProcessor] Donor history revert error:', donorError);
      }
    }

    // Invalidate caches
    const { adminDataService } = await import('@/lib/services/AdminDataService');
    adminDataService.invalidateCache('donations');
    adminDataService.invalidateCache('campaigns');
  }

  private async handleDonationFailed(event: DonationFailedEvent): Promise<void> {
    // Log failed donation for monitoring
    console.log('[DonationProjectionProcessor] Payment failed:', {
      donationId: event.payload.donationId,
      reason: event.payload.reason,
      retryable: event.payload.retryable,
    });
  }
}
