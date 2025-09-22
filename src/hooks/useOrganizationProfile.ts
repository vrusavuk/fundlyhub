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

      // Fetch basic organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;

      if (!orgData) {
        setProfile(null);
        return;
      }

      // Get campaign count
      const { count: campaignCount, error: campaignError } = await supabase
        .from('fundraisers')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'active');

      if (campaignError) console.error('Error fetching campaign count:', campaignError);

      // Get follower count
      const { count: followerCount, error: followerError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', organizationId)
        .eq('following_type', 'organization');

      if (followerError) console.error('Error fetching follower count:', followerError);

      // Get fundraiser IDs for total funds calculation
      const { data: orgFundraisers, error: fundraiserError } = await supabase
        .from('fundraisers')
        .select('id')
        .eq('org_id', organizationId);

      if (fundraiserError) console.error('Error fetching fundraiser list:', fundraiserError);

      let totalFundsRaised = 0;
      if (orgFundraisers && orgFundraisers.length > 0) {
        const fundraiserIds = orgFundraisers.map(f => f.id);
        
        const { data: statsData, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('total_raised')
          .in('fundraiser_id', fundraiserIds);

        if (statsError) console.error('Error fetching fundraiser stats:', statsError);

        totalFundsRaised = statsData?.reduce((sum, stat) => {
          return sum + (Number(stat.total_raised) || 0);
        }, 0) || 0;
      }

      setProfile({
        id: orgData.id,
        legal_name: orgData.legal_name,
        dba_name: orgData.dba_name,
        website: orgData.website,
        country: orgData.country,
        categories: orgData.categories || [],
        verification_status: orgData.verification_status,
        created_at: orgData.created_at,
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