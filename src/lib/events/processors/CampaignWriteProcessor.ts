/**
 * Campaign Write Processor
 * Handles ALL database writes for campaign events (proper event-driven architecture)
 * 
 * This processor is the ONLY place where campaign database writes should happen.
 * The mutation service should only publish events, not write to the database.
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { CampaignCreatedEvent, CampaignUpdatedEvent } from '../domain/CampaignEvents';
import { eventIdempotency } from '../EventIdempotency';
import { logger } from '@/lib/services/logger.service';
import { AppConfig } from '@/config/app.config';

export class CampaignWriteProcessor implements EventHandler<CampaignCreatedEvent | CampaignUpdatedEvent> {
  readonly eventType = 'campaign.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'CampaignWriteProcessor');
    
    if (!shouldProcess) {
      logger.debug('Skipping duplicate event', {
        componentName: 'CampaignWriteProcessor',
        operationName: 'handle',
        metadata: { eventId: event.id },
      });
      return;
    }

    try {
      if (event.type === 'campaign.created') {
        await this.handleCampaignCreated(event as CampaignCreatedEvent);
      } else if (event.type === 'campaign.updated') {
        await this.handleCampaignUpdated(event as CampaignUpdatedEvent);
      }

      await eventIdempotency.markComplete(event.id, 'CampaignWriteProcessor');
      
      logger.info('Campaign event processed successfully', {
        componentName: 'CampaignWriteProcessor',
        operationName: 'handle',
        metadata: {
          eventId: event.id,
          eventType: event.type,
          campaignId: event.payload.campaignId,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'CampaignWriteProcessor', errorMessage);
      
      logger.error('Failed to process campaign event', error as Error, {
        componentName: 'CampaignWriteProcessor',
        operationName: 'handle',
        metadata: {
          eventId: event.id,
          eventType: event.type,
        },
      });
      
      throw error;
    }
  }

  /**
   * Handle campaign creation - performs actual DB write
   */
  private async handleCampaignCreated(event: CampaignCreatedEvent): Promise<void> {
    const { payload } = event;
    
    logger.info('Creating campaign in database', {
      componentName: 'CampaignWriteProcessor',
      operationName: 'handleCampaignCreated',
      userId: payload.userId,
      metadata: {
        campaignId: payload.campaignId,
        title: payload.title,
        visibility: payload.visibility,
      },
    });

    try {
      // Insert fundraiser into database
      const { data: fundraiser, error: insertError } = await supabase
        .from('fundraisers')
        .insert([{
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary || null,
          story_html: payload.story.replace(/\n/g, '<br>'),
          goal_amount: payload.goalAmount,
          currency: payload.currency || AppConfig.currency.default,
          category_id: payload.categoryId || null,
          beneficiary_name: payload.beneficiaryName || null,
          location: payload.location || null,
          cover_image: payload.coverImage || '/placeholder.svg',
          end_date: payload.endDate || null,
          owner_user_id: payload.userId,
          status: payload.status as any,
          visibility: payload.visibility as any,
          type: payload.type,
          is_discoverable: payload.isDiscoverable,
          is_project: payload.isProject,
          link_token: payload.linkToken || null,
          passcode_hash: payload.passcode ? await this.hashPasscode(payload.passcode) : null,
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert fundraiser: ${insertError.message}`);
      }

      logger.info('Fundraiser created successfully', {
        componentName: 'CampaignWriteProcessor',
        userId: payload.userId,
        metadata: {
          fundraiserId: fundraiser.id,
          slug: fundraiser.slug,
        },
      });

      // Create milestones if project
      if (payload.isProject && payload.milestones && payload.milestones.length > 0) {
        const validMilestones = payload.milestones.filter(m => m.title && m.targetAmount);
        if (validMilestones.length > 0) {
          await this.createMilestones(fundraiser.id, validMilestones as any, payload.userId);
        }
      }

      // Link cover image if provided
      if (payload.coverImageId) {
        await this.linkCoverImage(payload.coverImageId, fundraiser.id, payload.userId);
      }

      // Handle access rules for private/unlisted campaigns
      if (payload.visibility !== 'public' && payload.allowlistEmails && payload.allowlistEmails.length > 0) {
        await this.createAccessRules(fundraiser.id, payload.allowlistEmails, payload.userId);
      }

      // Invalidate relevant caches
      await this.invalidateCaches(fundraiser.id, payload.categoryId);

      logger.performance(
        'campaign.created.processed',
        Date.now() - event.timestamp,
        {
          componentName: 'CampaignWriteProcessor',
          metadata: { campaignId: payload.campaignId },
        }
      );

    } catch (error) {
      logger.error('Failed to create campaign', error as Error, {
        componentName: 'CampaignWriteProcessor',
        userId: payload.userId,
        metadata: {
          campaignId: payload.campaignId,
          title: payload.title,
        },
      });
      throw error;
    }
  }

  /**
   * Handle campaign update - performs actual DB write
   */
  private async handleCampaignUpdated(event: CampaignUpdatedEvent): Promise<void> {
    const { payload } = event;

    logger.info('Updating campaign in database', {
      componentName: 'CampaignWriteProcessor',
      operationName: 'handleCampaignUpdated',
      userId: payload.userId,
      metadata: {
        campaignId: payload.campaignId,
        changeCount: Object.keys(payload.changes).length,
      },
    });

    try {
      const { data, error } = await supabase
        .from('fundraisers')
        .update({
          ...payload.changes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.campaignId)
        .eq('owner_user_id', payload.userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update fundraiser: ${error.message}`);
      }

      // Invalidate caches
      await this.invalidateCaches(payload.campaignId);

      logger.info('Campaign updated successfully', {
        componentName: 'CampaignWriteProcessor',
        userId: payload.userId,
        metadata: {
          campaignId: payload.campaignId,
        },
      });

    } catch (error) {
      logger.error('Failed to update campaign', error as Error, {
        componentName: 'CampaignWriteProcessor',
        userId: payload.userId,
        metadata: {
          campaignId: payload.campaignId,
        },
      });
      throw error;
    }
  }

  /**
   * Create project milestones
   */
  private async createMilestones(
    fundraiserId: string,
    milestones: Array<{ title: string; description?: string; targetAmount: number; dueDate?: string }>,
    userId: string
  ): Promise<void> {
    logger.debug('Creating project milestones', {
      componentName: 'CampaignWriteProcessor',
      metadata: {
        fundraiserId,
        milestoneCount: milestones.length,
      },
    });

    const { error } = await supabase
      .from('project_milestones')
      .insert(
        milestones.map(milestone => ({
          fundraiser_id: fundraiserId,
          title: milestone.title,
          description: milestone.description || null,
          target_amount: milestone.targetAmount,
          due_date: milestone.dueDate || null,
          created_by: userId,
          currency: AppConfig.currency.default,
        }))
      );

    if (error) {
      throw new Error(`Failed to create milestones: ${error.message}`);
    }

    logger.info('Milestones created successfully', {
      componentName: 'CampaignWriteProcessor',
      metadata: {
        fundraiserId,
        count: milestones.length,
      },
    });
  }

  /**
   * Link cover image to fundraiser
   */
  private async linkCoverImage(
    coverImageId: string,
    fundraiserId: string,
    userId: string
  ): Promise<void> {
    logger.debug('Linking cover image to fundraiser', {
      componentName: 'CampaignWriteProcessor',
      metadata: {
        coverImageId,
        fundraiserId,
      },
    });

    const { error } = await supabase
      .from('fundraiser_images')
      .update({ fundraiser_id: fundraiserId })
      .eq('id', coverImageId)
      .eq('user_id', userId);

    if (error) {
      logger.warn('Failed to link cover image', {
        componentName: 'CampaignWriteProcessor',
        metadata: {
          error: error.message,
          coverImageId,
        },
      });
      // Don't throw - this is not critical
    }
  }

  /**
   * Create access rules for private campaigns
   */
  private async createAccessRules(
    campaignId: string,
    allowlistEmails: string[],
    userId: string
  ): Promise<void> {
    logger.debug('Creating access rules', {
      componentName: 'CampaignWriteProcessor',
      metadata: {
        campaignId,
        ruleCount: allowlistEmails.length,
      },
    });

    const { error } = await supabase
      .from('campaign_access_rules')
      .insert(
        allowlistEmails.map(email => ({
          campaign_id: campaignId,
          rule_type: 'email_allowlist',
          rule_value: email.toLowerCase().trim(),
          created_by: userId,
        }))
      );

    if (error) {
      throw new Error(`Failed to create access rules: ${error.message}`);
    }
  }

  /**
   * Hash passcode for storage
   */
  private async hashPasscode(passcode: string): Promise<string> {
    // Simple hash for now - in production, use proper crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(passcode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Invalidate relevant caches
   */
  private async invalidateCaches(fundraiserId: string, categoryId?: string): Promise<void> {
    const { cacheService } = await import('@/lib/services/cache.service');
    
    // Granular cache invalidation (not broad `fundraisers:*`)
    await cacheService.invalidateByPattern(`fundraiser:${fundraiserId}*`);
    
    if (categoryId) {
      await cacheService.invalidateByTag(`category:${categoryId}`);
    }
    
    // Invalidate user's fundraiser list
    await cacheService.invalidateByPattern('user-fundraisers:*');
  }
}
