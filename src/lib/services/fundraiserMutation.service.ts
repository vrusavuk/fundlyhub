/**
 * Fundraiser Mutation Service
 * Handles all fundraiser creation, updates, and draft management
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';
import { mutationService } from './mutation.service';
import { cacheService } from './cache.service';
import { globalEventBus } from '@/lib/events';
import { createCampaignCreatedEvent, createCampaignUpdatedEvent } from '@/lib/events/domain/CampaignEvents';
import { FundraiserCreationRules } from '@/lib/business-rules/fundraiser-creation.rules';
import { CompleteFundraiser } from '@/lib/validation/fundraiserCreation.schema';

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

      // Create fundraiser
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
          currency: 'USD',
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant caches
      await cacheService.invalidateByPattern('fundraisers:*');
      await cacheService.invalidateByPattern('categories:*');

      // Publish event
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
