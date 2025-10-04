import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  social_links: Record<string, any>;
  profile_visibility: string;
  role: string;
  campaign_count: number;
  total_funds_raised: number;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserProfile(userId: string): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if viewing own profile
      const { data: { user } } = await supabase.auth.getUser();
      const isOwnProfile = user?.id === userId;

      let profileData: any;

      if (isOwnProfile) {
        // Use secure function to get own complete profile including sensitive fields
        const { data, error: profileError } = await supabase
          .rpc('get_my_complete_profile');

        if (profileError) throw profileError;
        profileData = data && data.length > 0 ? data[0] : null;
      } else {
        // Use public_profiles view for other users (no sensitive data)
        const { data, error: profileError } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        profileData = data;
      }

      if (!profileData) {
        setProfile(null);
        return;
      }

      // Calculate real-time following count (both users and organizations)
      const { count: followingCount, error: followingError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) console.error('Error fetching following count:', followingError);

      // Calculate real-time follower count (only users can follow users)
      const { count: followerCount, error: followerError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('following_type', 'user');

      if (followerError) console.error('Error fetching follower count:', followerError);

      // Calculate real-time campaign count (active campaigns only)
      const { count: campaignCount, error: campaignError } = await supabase
        .from('fundraisers')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', userId)
        .eq('status', 'active');

      if (campaignError) console.error('Error fetching campaign count:', campaignError);

      // Calculate real-time total funds raised
      // First get all fundraiser IDs that belong to this user
      const { data: userFundraisers, error: fundraiserError } = await supabase
        .from('fundraisers')
        .select('id')
        .eq('owner_user_id', userId);

      if (fundraiserError) console.error('Error fetching user fundraisers:', fundraiserError);

      let totalFundsRaised = 0;
      if (userFundraisers && userFundraisers.length > 0) {
        const fundraiserIds = userFundraisers.map(f => f.id);
        
        // Get stats for all user's fundraisers
        const { data: fundraiserStats, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('total_raised')
          .in('fundraiser_id', fundraiserIds);

        if (statsError) console.error('Error fetching fundraiser stats:', statsError);

        // Sum up total funds raised from all user's campaigns
        totalFundsRaised = fundraiserStats?.reduce((sum, stat) => {
          return sum + (Number(stat.total_raised) || 0);
        }, 0) || 0;
      }

      setProfile({
        id: profileData.id,
        name: profileData.name,
        email: isOwnProfile ? profileData.email : null, // Only include email for own profile
        avatar: profileData.avatar,
        bio: profileData.bio || null,
        location: profileData.location || null,
        website: profileData.website || null,
        social_links: (profileData.social_links as Record<string, any>) || {},
        profile_visibility: profileData.profile_visibility || 'public',
        role: profileData.role || 'visitor',
        campaign_count: campaignCount || 0,
        total_funds_raised: totalFundsRaised,
        follower_count: followerCount || 0,
        following_count: followingCount || 0,
        created_at: profileData.created_at
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

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