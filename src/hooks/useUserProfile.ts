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
        // Use secure function to get public profile (no sensitive data)
        const { data, error: profileError } = await supabase
          .rpc('get_public_user_profile', { profile_id: userId });

        if (profileError) throw profileError;
        profileData = data && data.length > 0 ? data[0] : null;
      }

      if (!profileData) {
        setProfile(null);
        return;
      }

      // Get all stats in a single optimized RPC call
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_profile_stats', { target_user_id: userId })
        .single();

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
        throw statsError;
      }

      const {
        follower_count: followerCount = 0,
        following_count: followingCount = 0,
        campaign_count: campaignCount = 0,
        total_funds_raised: totalFundsRaised = 0
      } = stats || {};

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