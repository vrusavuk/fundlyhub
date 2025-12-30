/**
 * Fundraiser Mutation Service
 * Handles all fundraiser creation, updates, and draft management
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';
import { mutationService } from './mutation.service';
import { cacheService } from './cache.service';
import { globalEventBus } from '@/lib/events';
import { createCampaignCreatedEvent, createCampaignUpdatedEvent, createCampaignStatusChangedEvent } from '@/lib/events/domain/CampaignEvents';
import { FundraiserCreationRules } from '@/lib/business-rules/fundraiser-creation.rules';
import { CompleteFundraiser } from '@/lib/validation/fundraiserCreation.schema';
import { campaignAccessApi } from '@/lib/api/campaignAccessApi';
import { logger } from './logger.service';

export interface CreateFundraiserInput extends CompleteFundraiser {
  userId: string;
  status?: 'draft' | 'pending' | 'active';
  coverImageId?: string;
}

export interface UpdateFundraiserInput {
  id: string;
  userId: string;
  updates: Partial<CompleteFundraiser>;
}

export class FundraiserMutationService {
  /**
   * Create a new fundraiser (Event-Driven - Pure Command)
   * Publishes event and delegates all DB operations to CampaignWriteProcessor
   */
  async createFundraiser(input: CreateFundraiserInput) {
    try {
      const visibility = input.visibility || 'public';
      const type = input.type || 'personal';

      // For private/unlisted fundraisers, use the Edge Function flow
      if (visibility === 'private' || visibility === 'unlisted') {
        return await this.createPrivateFundraiser(input);
      }

      // Generate unique slug
      const baseSlug = FundraiserCreationRules.generateSlug(input.title);
      const slug = await FundraiserCreationRules.ensureUniqueSlug(baseSlug);

      // Get user role to determine initial status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', input.userId)
        .single();

      const status = input.status || FundraiserCreationRules.determineInitialStatus(profile?.role || 'visitor');

      // Generate temporary campaign ID for event
      const campaignId = crypto.randomUUID();

      // Transform milestones to match event schema (camelCase)
      const transformedMilestones = input.milestones?.map(m => ({
        title: m.title,
        description: m.description,
        targetAmount: m.target_amount,
        dueDate: m.due_date,
      }));

      // Publish event with complete payload - CampaignWriteProcessor handles DB operations
      const event = createCampaignCreatedEvent({
        campaignId,
        userId: input.userId,
        title: input.title,
        slug,
        summary: input.summary,
        story: input.story,
        goalAmount: input.goalAmount,
        currency: 'USD',
        categoryId: input.categoryId,
        beneficiaryName: input.beneficiaryName,
        location: input.location,
        coverImage: input.coverImage,
        coverImageId: input.coverImageId,
        endDate: input.endDate,
        visibility: 'public',
        type,
        status,
        isProject: input.isProject || false,
        isDiscoverable: true,
        milestones: transformedMilestones,
      });
      
      // Wait for event processing (DB write happens in processor)
      await globalEventBus.publish(event);

      // Query the created fundraiser from DB (read model)
      const { data: createdFundraiser, error: fetchError } = await supabase
        .from('fundraisers')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;

      logger.info('Fundraiser created successfully', {
        campaignId: createdFundraiser.id,
        slug,
        userId: input.userId,
        type,
        visibility,
      });

      return { success: true, data: createdFundraiser, error: null };
    } catch (error: any) {
      logger.error('Error creating fundraiser', error, {
        userId: input.userId,
        title: input.title,
      });
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Create a private or unlisted fundraiser (Event-Driven - Pure Command)
   * Uses Edge Function for initial creation, then publishes event for additional data
   */
  private async createPrivateFundraiser(input: CreateFundraiserInput) {
    try {
      const allowlistEmails = input.allowlistEmails
        ? input.allowlistEmails.split(',').map(e => e.trim()).filter(Boolean)
        : [];

      // Use edge function to create base campaign with access rules
      const response = await campaignAccessApi.createCampaign({
        name: input.title,
        type: input.type || 'personal',
        visibility: input.visibility || 'private',
        goal_amount: input.goalAmount,
        currency: 'USD',
        access: {
          allowlist_emails: allowlistEmails.length > 0 ? allowlistEmails : undefined,
          passcode: input.passcode || undefined,
        },
      });

      // Get the created campaign's basic data
      const { data: campaign, error: fetchError } = await supabase
        .from('fundraisers')
        .select('slug, status')
        .eq('id', response.campaign_id)
        .single();

      if (fetchError) throw fetchError;

      // Transform milestones to match event schema (camelCase)
      const transformedMilestones = input.milestones?.map(m => ({
        title: m.title,
        description: m.description,
        targetAmount: m.target_amount,
        dueDate: m.due_date,
      }));

      // Publish event with complete payload - CampaignWriteProcessor handles updates
      const event = createCampaignCreatedEvent({
        campaignId: response.campaign_id,
        userId: input.userId,
        title: input.title,
        slug: campaign?.slug || '',
        summary: input.summary,
        story: input.story,
        goalAmount: input.goalAmount,
        currency: 'USD',
        categoryId: input.categoryId,
        beneficiaryName: input.beneficiaryName,
        location: input.location,
        coverImage: input.coverImage,
        coverImageId: input.coverImageId,
        endDate: input.endDate,
        visibility: (input.visibility === 'unlisted' ? 'unlisted' : input.visibility) as 'public' | 'private' | 'unlisted',
        type: input.type || 'personal',
        status: campaign?.status || 'active',
        isProject: input.isProject || false,
        isDiscoverable: input.visibility !== 'private',
        milestones: transformedMilestones,
        allowlistEmails: allowlistEmails,
        passcode: input.passcode,
        linkToken: response.link_token,
      });
      
      // Wait for event processing (DB updates, milestones, image linking happens in processor)
      await globalEventBus.publish(event);

      // For personal private/unlisted campaigns, publish status change event
      const shouldAutoActivate = (input.type === 'personal' || !input.type) && 
                                  (input.visibility === 'private' || input.visibility === 'unlisted');
      
      if (shouldAutoActivate) {
        const statusEvent = createCampaignStatusChangedEvent({
          campaignId: response.campaign_id,
          previousStatus: 'draft',
          newStatus: 'active',
          reason: 'Private/unlisted personal campaigns are auto-activated'
        });
        
        await globalEventBus.publish(statusEvent);
      }

      // Query the updated fundraiser from DB (read model)
      const { data: updatedCampaign, error: updateFetchError } = await supabase
        .from('fundraisers')
        .select('*')
        .eq('id', response.campaign_id)
        .single();

      if (updateFetchError) throw updateFetchError;

      logger.info('Private/unlisted fundraiser created successfully', {
        campaignId: response.campaign_id,
        slug: campaign?.slug,
        userId: input.userId,
        visibility: input.visibility,
        hasPasscode: !!input.passcode,
        allowlistCount: allowlistEmails.length,
      });

      // Return with link_token for navigation
      return { 
        success: true, 
        data: { 
          ...updatedCampaign, 
          link_token: response.link_token 
        }, 
        error: null 
      };
    } catch (error: any) {
      logger.error('Error creating private fundraiser', error, {
        userId: input.userId,
        title: input.title,
        visibility: input.visibility,
      });
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Update an existing fundraiser (Event-Driven - Pure Command)
   * Publishes event and delegates DB operations to CampaignWriteProcessor
   */
  async updateFundraiser(input: UpdateFundraiserInput) {
    try {
      // Get current fundraiser data for previousValues
      const { data: currentFundraiser } = await supabase
        .from('fundraisers')
        .select('*')
        .eq('id', input.id)
        .eq('owner_user_id', input.userId)
        .single();

      if (!currentFundraiser) {
        throw new Error('Fundraiser not found or access denied');
      }

      // Extract previous values for changed fields
      const previousValues: Record<string, any> = {};
      Object.keys(input.updates).forEach(key => {
        if (key in currentFundraiser) {
          previousValues[key] = currentFundraiser[key as keyof typeof currentFundraiser];
        }
      });

      // Publish event - CampaignWriteProcessor handles DB update
      const event = createCampaignUpdatedEvent({
        campaignId: input.id,
        userId: input.userId,
        changes: input.updates,
        previousValues,
      });
      
      await globalEventBus.publish(event);

      // Query updated fundraiser (read model)
      const { data: updatedFundraiser, error: fetchError } = await supabase
        .from('fundraisers')
        .select('*')
        .eq('id', input.id)
        .single();

      if (fetchError) throw fetchError;

      logger.info('Fundraiser updated successfully', {
        campaignId: input.id,
        userId: input.userId,
        changedFields: Object.keys(input.updates),
      });

      return { success: true, data: updatedFundraiser, error: null };
    } catch (error: any) {
      logger.error('Error updating fundraiser', error, {
        campaignId: input.id,
        userId: input.userId,
      });
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Save draft to localStorage
   */
  saveDraftToLocal(userId: string, draft: Partial<CompleteFundraiser>) {
    try {
      const key = `fundraiser_draft_${userId}`;
      const draftData = {
        ...draft,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      
      localStorage.setItem(key, JSON.stringify(draftData));
      logger.debug('Draft saved to localStorage', { userId, draftFields: Object.keys(draft) });
      return { success: true };
    } catch (error: any) {
      logger.error('Error saving draft to localStorage', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load draft from localStorage
   */
  loadDraftFromLocal(userId: string): Partial<CompleteFundraiser> | null {
    try {
      const key = `fundraiser_draft_${userId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const draft = JSON.parse(stored);
      
      // Check if expired
      if (new Date(draft.expiresAt) < new Date()) {
        localStorage.removeItem(key);
        logger.debug('Draft expired and removed', { userId });
        return null;
      }
      
      logger.debug('Draft loaded from localStorage', { userId, draftFields: Object.keys(draft) });
      return draft;
    } catch (error) {
      logger.error('Error loading draft from localStorage', error as Error, { userId });
      return null;
    }
  }

  /**
   * Clear draft from localStorage
   */
  clearDraftFromLocal(userId: string) {
    try {
      const key = `fundraiser_draft_${userId}`;
      localStorage.removeItem(key);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate slug uniqueness
   */
  async validateSlugUniqueness(slug: string): Promise<boolean> {
    return FundraiserCreationRules.validateSlugUniqueness(slug);
  }
}

export const fundraiserMutationService = new FundraiserMutationService();
