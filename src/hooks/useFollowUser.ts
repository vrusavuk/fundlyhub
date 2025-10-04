import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFollowUserReturn {
  isFollowing: boolean;
  loading: boolean;
  followUser: () => Promise<void>;
  unfollowUser: () => Promise<void>;
  checkFollowStatus: () => Promise<void>;
}

export function useFollowUser(targetUserId: string): UseFollowUserReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === targetUserId) return;

      const { data, error } = await supabase.functions.invoke('check-follow-status', {
        body: { targetUserId }
      });

      if (error) {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(data?.isFollowing || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const followUser = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to follow users",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('follow-user', {
        body: { targetUserId }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: error.message || data?.error || "Failed to follow user",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        console.error('Response error:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      // Success - update state and refresh status
      await checkFollowStatus();
      toast({
        title: "Success",
        description: data?.message || "User followed successfully"
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to follow user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('unfollow-user', {
        body: { targetUserId }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: error.message || data?.error || "Failed to unfollow user",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        console.error('Response error:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      // Success - update state and refresh status
      await checkFollowStatus();
      toast({
        title: "Success",
        description: data?.message || "User unfollowed successfully"
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unfollow user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    checkFollowStatus
  };
}