/**
 * Access control types for private fundraisers
 */

export interface CampaignAccessRule {
  id: string;
  campaign_id: string;
  rule_type: 'allowlist' | 'domain';
  rule_value: string;
  created_at: string;
  created_by?: string;
}

export interface CampaignInvite {
  id: string;
  campaign_id: string;
  contact: string;
  role: string;
  status: 'invited' | 'accepted' | 'revoked';
  created_at: string;
  accepted_at?: string;
  created_by?: string;
}

export interface AccessCheckRequest {
  campaign_id: string;
  link_token?: string;
  passcode?: string;
  contact?: string;
}

export interface AccessCheckResponse {
  allow: boolean;
  reason?: string;
}

export interface CreateCampaignRequest {
  name: string;
  type?: 'personal' | 'charity';
  visibility?: 'public' | 'unlisted' | 'private';
  goal_amount?: number;
  currency?: string;
  access?: {
    allowlist_emails?: string[];
    passcode?: string;
  };
}

export interface CreateCampaignResponse {
  campaign_id: string;
  link_token: string;
}

export interface RotateLinkResponse {
  link_token: string;
}
