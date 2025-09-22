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

      // For now, fetch basic profile data from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          social_links: (data.social_links as Record<string, any>) || {},
          profile_visibility: data.profile_visibility || 'public',
          role: data.role || 'visitor',
          campaign_count: Number(data.campaign_count || 0),
          total_funds_raised: Number(data.total_funds_raised || 0),
          follower_count: Number(data.follower_count || 0),
          following_count: Number(data.following_count || 0),
          created_at: data.created_at
        });
      } else {
        setProfile(null);
      }
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