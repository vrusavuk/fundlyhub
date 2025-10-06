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

export interface CreateFundraiserInput extends CompleteFundraiser {
  userId: string;
  status?: 'draft' | 'pending' | 'active';
}

export interface UpdateFundraiserInput {
  id: string;
  userId: string;
  updates: Partial<CompleteFundraiser>;
}

export class FundraiserMutationService {
  /**
   * Create a new fundraiser
   */
  async createFundraiser(input: CreateFundraiserInput) {
    try {
      const visibility = input.visibility || 'public';
      const type = input.type || 'personal';

      // For private/unlisted fundraisers, use the Edge Function
      if (visibility === 'private' || visibility === 'unlisted') {
        return await this.createPrivateFundraiser(input);
      }

      // For public fundraisers, use direct DB insert (existing flow)
      const baseSlug = FundraiserCreationRules.generateSlug(input.title);
      const slug = await FundraiserCreationRules.ensureUniqueSlug(baseSlug);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', input.userId)
        .single();

      const status = input.status || FundraiserCreationRules.determineInitialStatus(profile?.role || 'visitor');

      const { data, error } = await supabase
        .from('fundraisers')
        .insert({
          title: input.title,
          slug,
          summary: input.summary,
          story_html: input.story.replace(/\n/g, '<br>'),
          goal_amount: input.goalAmount,
          category_id: input.categoryId,
          beneficiary_name: input.beneficiaryName || null,
          location: input.location || null,
          cover_image: input.coverImage || '/placeholder.svg',
          end_date: input.endDate || null,
          owner_user_id: input.userId,
          status,
          visibility: 'public',
          type,
          is_discoverable: true,
          currency: 'USD',
        })
        .select()
        .single();

      if (error) throw error;

      await cacheService.invalidateByPattern('fundraisers:*');
      await cacheService.invalidateByPattern('categories:*');

      const event = createCampaignCreatedEvent({
        campaignId: data.id,
        userId: input.userId,
        title: input.title,
        description: input.summary,
        goalAmount: input.goalAmount,
        categoryId: input.categoryId,
        visibility: 'public',
      });
      
      await globalEventBus.publish(event);

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Error creating fundraiser:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Create a private or unlisted fundraiser via Edge Function
   */
  private async createPrivateFundraiser(input: CreateFundraiserInput) {
    try {
      const allowlistEmails = input.allowlistEmails
        ? input.allowlistEmails.split(',').map(e => e.trim()).filter(Boolean)
        : [];

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

      // Get the created campaign to update additional fields
      const { data: campaign, error: fetchError } = await supabase
        .from('fundraisers')
        .select()
        .eq('id', response.campaign_id)
        .single();

      if (fetchError) throw fetchError;

      // Update with additional fields
      const { data: updatedCampaign, error: updateError } = await supabase
        .from('fundraisers')
        .update({
          summary: input.summary,
          story_html: input.story.replace(/\n/g, '<br>'),
          category_id: input.categoryId,
          beneficiary_name: input.beneficiaryName || null,
          location: input.location || null,
          cover_image: input.coverImage || '/placeholder.svg',
          end_date: input.endDate || null,
        })
        .eq('id', response.campaign_id)
        .select()
        .single();

      if (updateError) throw updateError;

      await cacheService.invalidateByPattern('fundraisers:*');
      await cacheService.invalidateByPattern('categories:*');

      const event = createCampaignCreatedEvent({
        campaignId: response.campaign_id,
        userId: input.userId,
        title: input.title,
        description: input.summary,
        goalAmount: input.goalAmount,
        categoryId: input.categoryId,
        visibility: (input.visibility === 'unlisted' ? 'private' : input.visibility) as 'public' | 'private',
      });
      
      await globalEventBus.publish(event);

      // For personal private/unlisted campaigns, publish status change event to activate them
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
      console.error('Error creating private fundraiser:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Update an existing fundraiser
   */
  async updateFundraiser(input: UpdateFundraiserInput) {
    try {
      const { data, error } = await supabase
        .from('fundraisers')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('owner_user_id', input.userId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await cacheService.invalidateByPattern('fundraisers:*');
      await cacheService.invalidateByPattern(`fundraiser:${input.id}:*`);

      // Publish event
      const event = createCampaignUpdatedEvent({
        campaignId: input.id,
        userId: input.userId,
        changes: input.updates,
      });
      
      await globalEventBus.publish(event);

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Error updating fundraiser:', error);
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
      return { success: true };
    } catch (error: any) {
      console.error('Error saving draft:', error);
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
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
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
