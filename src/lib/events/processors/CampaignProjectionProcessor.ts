/**
 * Campaign Projection Processor
 * Updates CQRS projection tables for optimized reads
 */

import { supabase } from '@/integrations/supabase/client';
import type { DomainEvent, EventHandler } from '../types';
import type { CampaignCreatedEvent, CampaignUpdatedEvent, CampaignDeletedEvent } from '../domain/CampaignEvents';
import { eventIdempotency } from '../EventIdempotency';

export class CampaignProjectionProcessor implements EventHandler {
  readonly eventType = 'campaign.*';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'CampaignProjectionProcessor');
    
    if (!shouldProcess) {
      return;
    }

    try {
      if (event.type === 'campaign.created') {
        await this.handleCampaignCreated(event as CampaignCreatedEvent);
      } else if (event.type === 'campaign.updated') {
        await this.handleCampaignUpdated(event as CampaignUpdatedEvent);
      } else if (event.type === 'campaign.deleted') {
        await this.handleCampaignDeleted(event as CampaignDeletedEvent);
      }

      await eventIdempotency.markComplete(event.id, 'CampaignProjectionProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'CampaignProjectionProcessor', errorMessage);
      console.error('[CampaignProjectionProcessor] Error:', error);
    }
  }

  private async handleCampaignCreated(event: CampaignCreatedEvent): Promise<void> {
    // Fetch the full campaign data
    const { data: campaign, error: fetchError } = await supabase
      .from('fundraisers')
      .select(`
        *,
        owner:profiles!owner_user_id(name, avatar),
        organization:organizations!org_id(legal_name, dba_name),
        category:categories!category_id(name)
      `)
      .eq('owner_user_id', event.payload.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !campaign) {
      console.error('[CampaignProjectionProcessor] Failed to fetch campaign:', fetchError);
      return;
    }

    // Update campaign summary projection
    await supabase
      .from('campaign_summary_projection')
      .insert({
        campaign_id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        summary: campaign.summary,
        cover_image: campaign.cover_image,
        goal_amount: campaign.goal_amount,
        total_raised: 0,
        donor_count: 0,
        status: campaign.status,
        visibility: campaign.visibility,
        category_id: campaign.category_id,
        owner_user_id: campaign.owner_user_id,
        owner_name: campaign.owner?.name,
        owner_avatar: campaign.owner?.avatar,
        org_id: campaign.org_id,
        org_name: campaign.organization?.dba_name || campaign.organization?.legal_name,
        created_at: campaign.created_at,
        end_date: campaign.end_date,
        days_remaining: campaign.end_date ? Math.max(0, Math.floor((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
      });

    // Initialize campaign stats projection
    await supabase
      .from('campaign_stats_projection')
      .insert({
        campaign_id: campaign.id,
        total_donations: 0,
        donation_count: 0,
        unique_donors: 0,
        average_donation: 0,
        view_count: 0,
        share_count: 0,
        comment_count: 0,
        update_count: 0,
      });

    // Initialize campaign search projection
    await supabase
      .from('campaign_search_projection')
      .insert({
        campaign_id: campaign.id,
        title: campaign.title,
        summary: campaign.summary,
        story_text: campaign.story_html?.replace(/<[^>]*>/g, ' ') || '', // Strip HTML for search
        beneficiary_name: campaign.beneficiary_name,
        location: campaign.location,
        tags: campaign.tags,
        category_name: campaign.category?.name,
        owner_name: campaign.owner?.name,
        org_name: campaign.organization?.dba_name || campaign.organization?.legal_name,
        status: campaign.status,
        visibility: campaign.visibility,
        created_at: campaign.created_at,
      });

    console.log(`[CampaignProjectionProcessor] Created projections for campaign ${campaign.id}`);
  }

  private async handleCampaignUpdated(event: CampaignUpdatedEvent): Promise<void> {
    const { campaignId } = event.payload;

    // Fetch updated campaign data
    const { data: campaign } = await supabase
      .from('fundraisers')
      .select(`
        *,
        owner:profiles!owner_user_id(name, avatar),
        organization:organizations!org_id(legal_name, dba_name),
        category:categories!category_id(name)
      `)
      .eq('id', campaignId)
      .maybeSingle();

    if (!campaign) return;

    // Update campaign summary projection
    await supabase
      .from('campaign_summary_projection')
      .update({
        title: campaign.title,
        summary: campaign.summary,
        cover_image: campaign.cover_image,
        goal_amount: campaign.goal_amount,
        status: campaign.status,
        visibility: campaign.visibility,
        category_id: campaign.category_id,
        end_date: campaign.end_date,
        days_remaining: campaign.end_date ? Math.max(0, Math.floor((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId);

    // Update campaign search projection
    await supabase
      .from('campaign_search_projection')
      .update({
        title: campaign.title,
        summary: campaign.summary,
        story_text: campaign.story_html?.replace(/<[^>]*>/g, ' ') || '',
        beneficiary_name: campaign.beneficiary_name,
        location: campaign.location,
        tags: campaign.tags,
        category_name: campaign.category?.name,
        status: campaign.status,
        visibility: campaign.visibility,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId);

    console.log(`[CampaignProjectionProcessor] Updated projections for campaign ${campaignId}`);
  }

  private async handleCampaignDeleted(event: CampaignDeletedEvent): Promise<void> {
    const { campaignId } = event.payload;

    // Projections will cascade delete due to foreign key constraints
    console.log(`[CampaignProjectionProcessor] Projections deleted for campaign ${campaignId}`);
  }
}
