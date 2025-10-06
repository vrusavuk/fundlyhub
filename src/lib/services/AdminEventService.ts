/**
 * Admin Event Service
 * Wraps all admin operations with event publishing
 * Following Single Responsibility and Open/Closed Principles
 */

import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import {
  createUserSuspendedEvent,
  createUserUnsuspendedEvent,
  createUserDeletedEvent,
  createCampaignApprovedEvent,
  createCampaignRejectedEvent,
  createCampaignPausedEvent,
  createCampaignClosedEvent,
} from '@/lib/events/domain/AdminEvents';
import { createUserProfileUpdatedEvent } from '@/lib/events/domain/UserEvents';
import {
  createOrganizationVerifiedEvent,
  createOrganizationRejectedEvent,
  createOrganizationUpdatedEvent,
} from '@/lib/events/domain/OrganizationEvents';
import {
  createCampaignUpdatedEvent,
  createCampaignDeletedEvent,
} from '@/lib/events/domain/CampaignEvents';

export class AdminEventService {
  /**
   * Suspend a user and publish event
   */
  static async suspendUser(
    userId: string,
    suspendedBy: string,
    reason: string,
    duration: number
  ) {
    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + duration);

    // Database operation
    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: 'suspended',
        suspended_until: suspendUntil.toISOString(),
        suspension_reason: reason,
      })
      .eq('id', userId);

    if (error) throw error;

    // Publish event
    const event = createUserSuspendedEvent({
      userId,
      suspendedBy,
      reason,
      duration,
      suspendedUntil: suspendUntil.toISOString(),
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: suspendedBy,
      _action: 'user_suspended',
      _resource_type: 'user',
      _resource_id: userId,
      _metadata: { reason, duration },
    });

    return { success: true };
  }

  /**
   * Unsuspend a user and publish event
   */
  static async unsuspendUser(userId: string, unsuspendedBy: string) {
    // Database operation
    const { error } = await supabase
      .from('profiles')
      .update({
        account_status: 'active',
        suspended_until: null,
        suspension_reason: null,
      })
      .eq('id', userId);

    if (error) throw error;

    // Publish event
    const event = createUserUnsuspendedEvent({
      userId,
      unsuspendedBy,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: unsuspendedBy,
      _action: 'user_unsuspended',
      _resource_type: 'user',
      _resource_id: userId,
    });

    return { success: true };
  }

  /**
   * Update user profile and publish event
   */
  static async updateUserProfile(
    userId: string,
    updatedBy: string,
    changes: Record<string, any>
  ) {
    // Database operation
    const { error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId);

    if (error) throw error;

    // Publish event
    const event = createUserProfileUpdatedEvent({
      userId,
      changes,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: updatedBy,
      _action: 'user_profile_updated',
      _resource_type: 'user',
      _resource_id: userId,
      _metadata: { changes },
    });

    return { success: true };
  }

  /**
   * Update campaign status and publish event
   */
  static async updateCampaignStatus(
    campaignId: string,
    updatedBy: string,
    status: 'active' | 'pending' | 'paused' | 'closed'
  ) {
    // Database operation
    const { error } = await supabase
      .from('fundraisers')
      .update({ status })
      .eq('id', campaignId);

    if (error) throw error;

    // Publish appropriate event based on status
    let event;
    switch (status) {
      case 'active':
        event = createCampaignApprovedEvent({ campaignId, approvedBy: updatedBy });
        break;
      case 'paused':
        event = createCampaignPausedEvent({ campaignId, pausedBy: updatedBy });
        break;
      case 'closed':
        event = createCampaignClosedEvent({ campaignId, closedBy: updatedBy });
        break;
      case 'pending':
        event = createCampaignUpdatedEvent({
          campaignId,
          userId: updatedBy,
          changes: { status: 'pending' },
        });
        break;
    }

    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: updatedBy,
      _action: `campaign_${status}`,
      _resource_type: 'campaign',
      _resource_id: campaignId,
      _metadata: { status },
    });

    return { success: true };
  }

  /**
   * Update campaign and publish event with validation
   */
  static async updateCampaign(
    campaignId: string,
    updatedBy: string,
    changes: Record<string, any>,
    options?: {
      validateTransitions?: boolean;
      reason?: string;
    }
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) throw new Error('User not authenticated');

    // 1. Fetch current campaign data for validation
    const { data: campaign, error: fetchError } = await supabase
      .from('fundraisers')
      .select('*, donations(id)')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      throw new Error(`Failed to fetch campaign: ${fetchError?.message}`);
    }

    // 2. Validate changes
    if (options?.validateTransitions !== false) {
      // Prevent reducing goal amount if donations exist
      if (changes.goal_amount && campaign.donations && campaign.donations.length > 0) {
        if (changes.goal_amount < campaign.goal_amount) {
          throw new Error('Cannot reduce goal amount after receiving donations');
        }
      }

      // Prevent changing currency if donations exist
      if (changes.currency && campaign.donations && campaign.donations.length > 0) {
        if (changes.currency !== campaign.currency) {
          throw new Error('Cannot change currency after receiving donations');
        }
      }

      // Validate status transitions
      if (changes.status) {
        const validTransitions: Record<string, string[]> = {
          draft: ['pending', 'active'],
          pending: ['active', 'draft'],
          active: ['paused', 'closed', 'ended'],
          paused: ['active', 'closed'],
          closed: [],
          ended: [],
        };

        const currentStatus = campaign.status;
        const newStatus = changes.status;
        
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
      }
    }

    // 3. Update database
    const { error: updateError } = await supabase
      .from('fundraisers')
      .update({
        ...changes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('❌ Failed to update campaign:', updateError);
      throw new Error(`Failed to update campaign: ${updateError.message}`);
    }

    console.log(`✅ Campaign ${campaignId} updated successfully`);

    // 4. Publish event
    await globalEventBus.publish(
      createCampaignUpdatedEvent({
        campaignId,
        userId: updatedBy,
        changes,
        previousValues: options?.reason ? { reason: options.reason, ownerId: campaign.owner_user_id } : undefined,
      })
    );

    // 5. Log audit trail with detailed field tracking
    await supabase.rpc('log_audit_event', {
      _actor_id: updatedBy,
      _action: 'campaign_updated',
      _resource_type: 'campaign',
      _resource_id: campaignId,
      _metadata: { 
        changes, 
        reason: options?.reason,
        changed_fields: Object.keys(changes),
        admin_edit: updatedBy !== campaign.owner_user_id,
      },
    });

    return { success: true };
  }

  /**
   * Delete campaign and publish event
   */
  static async deleteCampaign(campaignId: string, deletedBy: string) {
    // Database operation
    const { error } = await supabase
      .from('fundraisers')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;

    // Publish event
    const event = createCampaignDeletedEvent({
      campaignId,
      userId: deletedBy,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: deletedBy,
      _action: 'campaign_deleted',
      _resource_type: 'campaign',
      _resource_id: campaignId,
    });

    return { success: true };
  }

  /**
   * Verify organization and publish event
   */
  static async verifyOrganization(
    organizationId: string,
    verifiedBy: string
  ) {
    // Database operation
    const { error } = await supabase
      .from('organizations')
      .update({ verification_status: 'approved' })
      .eq('id', organizationId);

    if (error) throw error;

    // Publish event
    const event = createOrganizationVerifiedEvent({
      organizationId,
      verifiedBy,
      verifiedAt: Date.now(),
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: verifiedBy,
      _action: 'organization_verified',
      _resource_type: 'organization',
      _resource_id: organizationId,
    });

    return { success: true };
  }

  /**
   * Reject organization and publish event
   */
  static async rejectOrganization(
    organizationId: string,
    rejectedBy: string,
    reason: string
  ) {
    // Database operation
    const { error } = await supabase
      .from('organizations')
      .update({ verification_status: 'rejected' })
      .eq('id', organizationId);

    if (error) throw error;

    // Publish event
    const event = createOrganizationRejectedEvent({
      organizationId,
      rejectedBy,
      reason,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: rejectedBy,
      _action: 'organization_rejected',
      _resource_type: 'organization',
      _resource_id: organizationId,
      _metadata: { reason },
    });

    return { success: true };
  }

  /**
   * Update organization and publish event
   */
  static async updateOrganization(
    organizationId: string,
    updatedBy: string,
    changes: Record<string, any>
  ) {
    // Database operation
    const { error } = await supabase
      .from('organizations')
      .update(changes)
      .eq('id', organizationId);

    if (error) throw error;

    // Publish event
    const event = createOrganizationUpdatedEvent({
      organizationId,
      updatedBy,
      changes,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: updatedBy,
      _action: 'organization_updated',
      _resource_type: 'organization',
      _resource_id: organizationId,
      _metadata: { changes },
    });

    return { success: true };
  }

  /**
   * Bulk operation wrapper
   */
  static async bulkOperation<T>(
    operation: (item: T) => Promise<any>,
    items: T[]
  ) {
    const results = await Promise.allSettled(items.map(operation));
    
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    return {
      total: items.length,
      successes,
      failures,
      results,
    };
  }
}
