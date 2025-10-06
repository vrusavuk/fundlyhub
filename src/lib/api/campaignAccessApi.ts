/**
 * Campaign Access API
 * Handles private fundraiser access control
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AccessCheckRequest,
  AccessCheckResponse,
  CreateCampaignRequest,
  CreateCampaignResponse,
  RotateLinkResponse,
  CampaignAccessRule,
} from '@/types/domain/access';

export const campaignAccessApi = {
  /**
   * Check if user has access to a private campaign
   */
  async checkAccess(request: AccessCheckRequest): Promise<AccessCheckResponse> {
    const { data, error } = await supabase.functions.invoke('campaign-access', {
      body: request
    });
    
    if (error) {
      console.error('[campaignAccessApi] checkAccess error:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Create a new campaign with privacy settings
   */
  async createCampaign(request: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    const { data, error } = await supabase.functions.invoke('campaign-create', {
      body: request
    });
    
    if (error) {
      console.error('[campaignAccessApi] createCampaign error:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Rotate link token for a campaign
   */
  async rotateLink(campaignId: string): Promise<RotateLinkResponse> {
    const { data, error } = await supabase.functions.invoke('campaign-rotate-link', {
      body: { campaign_id: campaignId }
    });
    
    if (error) {
      console.error('[campaignAccessApi] rotateLink error:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Get access rules for a campaign
   */
  async getAccessRules(campaignId: string): Promise<CampaignAccessRule[]> {
    const { data, error } = await supabase
      .from('campaign_access_rules')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[campaignAccessApi] getAccessRules error:', error);
      throw error;
    }
    
    return (data || []) as CampaignAccessRule[];
  },

  /**
   * Add access rule (allowlist email)
   */
  async addAccessRule(
    campaignId: string,
    ruleType: 'allowlist' | 'domain',
    ruleValue: string
  ): Promise<CampaignAccessRule> {
    const { data, error } = await supabase
      .from('campaign_access_rules')
      .insert({
        campaign_id: campaignId,
        rule_type: ruleType,
        rule_value: ruleValue.toLowerCase()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[campaignAccessApi] addAccessRule error:', error);
      throw error;
    }
    
    return data as CampaignAccessRule;
  },

  /**
   * Remove access rule
   */
  async removeAccessRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_access_rules')
      .delete()
      .eq('id', ruleId);
    
    if (error) {
      console.error('[campaignAccessApi] removeAccessRule error:', error);
      throw error;
    }
  },
};
