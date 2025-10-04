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
        toast({
          title: "Error",
          description: error.message || "Failed to follow user",
          variant: "destructive"
        });
        return;
      }

      setIsFollowing(true);
      toast({
        title: "Success",
        description: "User followed successfully"
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
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

      const { error } = await supabase.functions.invoke('unfollow-user', {
        body: { targetUserId }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to unfollow user",
          variant: "destructive"
        });
        return;
      }

      setIsFollowing(false);
      toast({
        title: "Success",
        description: "User unfollowed successfully"
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
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