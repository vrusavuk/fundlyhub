/**
 * Admin Event Service
 * Wraps all admin operations with event publishing
 * Following Single Responsibility and Open/Closed Principles
 */

import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import { logger } from './logger.service';
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
      imageOperations?: {
        coverImageId?: string;
        coverImagePath?: string;
        previousCoverImageId?: string;
        galleryImageIds?: string[];
      };
    }
  ) {
    const context = {
      componentName: 'AdminEventService',
      operationName: 'updateCampaign',
      userId: updatedBy,
      metadata: { campaignId, changes, options },
    };

    logger.debug('Campaign update initiated', context);

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      logger.error('Campaign update failed: User not authenticated', undefined, context);
      throw new Error('User not authenticated');
    }

    // 1. Fetch current campaign
    logger.debug('Fetching campaign data', context);
    const { data: campaign, error: fetchError } = await supabase
      .from('fundraisers')
      .select('*, donations(id)')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      logger.error('Failed to fetch campaign for update', fetchError, {
        ...context,
        metadata: { ...context.metadata, fetchError: fetchError?.message },
      });
      throw new Error(`Failed to fetch campaign: ${fetchError?.message}`);
    }

    logger.debug('Campaign fetched successfully', {
      ...context,
      metadata: { 
        id: campaign.id, 
        owner: campaign.owner_user_id,
        status: campaign.status 
      },
    });

    // 2. Check permissions
    logger.debug('Checking campaign update permissions', context);
    const isOwner = campaign.owner_user_id === updatedBy;
    
    const { data: hasPermission, error: permError } = await supabase.rpc('user_has_permission', {
      _user_id: updatedBy,
      _permission_name: 'manage_campaigns'
    });

    logger.debug('Permission check completed', {
      ...context,
      metadata: {
        isOwner,
        hasManageCampaigns: hasPermission,
        permissionError: permError,
        canProceed: isOwner || hasPermission
      },
    });

    if (!isOwner && !hasPermission) {
      logger.security('Unauthorized campaign update attempt', 'medium', {
        ...context,
        metadata: { campaignId, ownerId: campaign.owner_user_id },
      });
      throw new Error('You do not have permission to update this campaign');
    }

    // 3. Validate changes
    if (options?.validateTransitions !== false) {
      logger.debug('Validating campaign transitions', context);
      
      // Prevent reducing goal amount if donations exist
      if (changes.goal_amount && campaign.donations && campaign.donations.length > 0) {
        if (changes.goal_amount < campaign.goal_amount) {
          logger.warn('Attempted to reduce goal amount with existing donations', {
            ...context,
            metadata: { 
              currentGoal: campaign.goal_amount, 
              newGoal: changes.goal_amount,
              donationCount: campaign.donations.length,
            },
          });
          throw new Error('Cannot reduce goal amount after receiving donations');
        }
      }

      // Prevent changing currency if donations exist
      if (changes.currency && campaign.donations && campaign.donations.length > 0) {
        if (changes.currency !== campaign.currency) {
          logger.warn('Attempted to change currency with existing donations', {
            ...context,
            metadata: { 
              currentCurrency: campaign.currency, 
              newCurrency: changes.currency,
              donationCount: campaign.donations.length,
            },
          });
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
          logger.warn('Invalid campaign status transition attempted', {
            ...context,
            metadata: { 
              from: currentStatus,
              to: newStatus,
              validTransitions: validTransitions[currentStatus],
            },
          });
          throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
      }
      
      logger.debug('Campaign transition validation passed', context);
    }

    // 4. Execute update
    logger.info('Executing campaign database update', {
      ...context,
      metadata: { changes, changedFields: Object.keys(changes) },
    });
    
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('fundraisers')
      .update({
        ...changes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      logger.error('Campaign database update failed', updateError, {
        ...context,
        metadata: {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        },
      });
      throw updateError;
    }

    logger.info('Campaign updated successfully', {
      ...context,
      metadata: { updatedCampaignId: updatedCampaign.id },
    });

    // 5. Handle image operations
    if (options?.imageOperations) {
      const { imageUploadService } = await import('./imageUpload.service');
      
      try {
        // If replacing cover image, delete old one
        if (options.imageOperations.previousCoverImageId && 
            options.imageOperations.coverImageId !== options.imageOperations.previousCoverImageId) {
          await imageUploadService.deleteImage(
            options.imageOperations.previousCoverImageId,
            updatedBy
          );
        }

        // Link new cover image
        if (options.imageOperations.coverImageId) {
          await imageUploadService.linkDraftImagesToFundraiser(
            [options.imageOperations.coverImageId],
            campaignId,
            updatedBy
          );
        }

        // Link gallery images
        if (options.imageOperations.galleryImageIds && 
            options.imageOperations.galleryImageIds.length > 0) {
          await imageUploadService.linkDraftImagesToFundraiser(
            options.imageOperations.galleryImageIds,
            campaignId,
            updatedBy
          );
        }
      } catch (imageError) {
        logger.error('Campaign image operation failed', imageError as Error, {
          ...context,
          metadata: { imageOperations: options.imageOperations },
        });
        // Campaign update succeeded but image linking failed
        // The calling component will handle user notification
      }
    }

    // 6. Publish event
    await globalEventBus.publish(
      createCampaignUpdatedEvent({
        campaignId,
        userId: updatedBy,
        changes,
        previousValues: options?.reason ? { reason: options.reason, ownerId: campaign.owner_user_id } : undefined,
      })
    );

    // 7. Log audit trail
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
        image_operations: options?.imageOperations ? true : false,
      },
    });

    logger.info('Campaign event published and audit logged', context);
    return { success: true };
  }

  /**
   * Soft delete campaign and publish event
   */
  static async deleteCampaign(campaignId: string, deletedBy: string, reason?: string) {
    // Soft delete: set deleted_at and deleted_by instead of hard delete
    const { error } = await supabase
      .from('fundraisers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
      })
      .eq('id', campaignId);

    if (error) throw error;

    // Publish event
    const event = createCampaignDeletedEvent({
      campaignId,
      userId: deletedBy,
      reason,
    });
    await globalEventBus.publish(event);

    // Log audit
    await supabase.rpc('log_audit_event', {
      _actor_id: deletedBy,
      _action: 'campaign_deleted',
      _resource_type: 'campaign',
      _resource_id: campaignId,
      _metadata: { reason, soft_delete: true },
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
