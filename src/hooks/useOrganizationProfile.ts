import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationProfile {
  id: string;
  legal_name: string;
  dba_name: string | null;
  website: string | null;
  country: string | null;
  categories: string[];
  verification_status: string;
  created_at: string;
  campaignCount: number;
  totalFundsRaised: number;
  followerCount: number;
}

interface UseOrganizationProfileReturn {
  profile: OrganizationProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrganizationProfile(organizationId: string): UseOrganizationProfileReturn {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use secure function to get only public organization information
      const { data: orgData, error: orgError } = await supabase
        .rpc('get_public_organization_info', { org_id: organizationId });

      if (orgError) throw orgError;

      // The function returns a table, so we need to get the first row
      const organizationData = orgData && orgData.length > 0 ? orgData[0] : null;

      if (!organizationData) {
        setProfile(null);
        return;
      }

      // Get all stats in a single optimized RPC call
      const { data: stats, error: statsError } = await supabase
        .rpc('get_organization_profile_stats', { target_org_id: organizationId })
        .single();

      if (statsError) {
        console.error('Error fetching organization stats:', statsError);
        throw statsError;
      }

      const {
        follower_count: followerCount = 0,
        campaign_count: campaignCount = 0,
        total_funds_raised: totalFundsRaised = 0
      } = stats || {};

      setProfile({
        id: organizationData.id,
        legal_name: organizationData.legal_name,
        dba_name: organizationData.dba_name,
        website: organizationData.website,
        country: organizationData.country,
        categories: organizationData.categories || [],
        verification_status: organizationData.verification_status,
        created_at: organizationData.created_at,
        campaignCount: campaignCount || 0,
        totalFundsRaised,
        followerCount: followerCount || 0
      });

    } catch (error) {
      console.error('Error fetching organization profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organization profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [organizationId]);

  const refresh = () => {
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refresh
  };
}