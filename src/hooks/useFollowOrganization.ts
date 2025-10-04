import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFollowOrganizationReturn {
  isFollowing: boolean;
  loading: boolean;
  followOrganization: () => Promise<void>;
  unfollowOrganization: () => Promise<void>;
  checkFollowStatus: () => Promise<void>;
}

export function useFollowOrganization(organizationId: string): UseFollowOrganizationReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) return;

      const { data, error } = await supabase.functions.invoke('check-organization-follow-status', {
        body: { organizationId }
      });

      if (error) {
        console.error('Error checking organization follow status:', error);
        return;
      }

      setIsFollowing(data?.isFollowing || false);
    } catch (error) {
      console.error('Error checking organization follow status:', error);
    }
  };

  const followOrganization = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to follow organizations",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('follow-organization', {
        body: { organizationId }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to follow organization",
          variant: "destructive"
        });
        return;
      }

      setIsFollowing(true);
      toast({
        title: "Success",
        description: "Organization followed successfully"
      });
    } catch (error) {
      console.error('Error following organization:', error);
      toast({
        title: "Error",
        description: "Failed to follow organization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const unfollowOrganization = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke('unfollow-organization', {
        body: { organizationId }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to unfollow organization",
          variant: "destructive"
        });
        return;
      }

      setIsFollowing(false);
      toast({
        title: "Success",
        description: "Organization unfollowed successfully"
      });
    } catch (error) {
      console.error('Error unfollowing organization:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow organization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    loading,
    followOrganization,
    unfollowOrganization,
    checkFollowStatus
  };
}