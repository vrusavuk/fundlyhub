/**
 * Event-Driven Follow Organization Hook
 * Implements optimistic updates and event sourcing
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEventPublisher } from './useEventBus';
import {
  createUserFollowedOrganizationEvent,
  createUserUnfollowedOrganizationEvent,
} from '@/lib/events/domain/UserEvents';
import { supabase } from '@/integrations/supabase/client';

interface UseFollowOrganizationReturn {
  isFollowing: boolean;
  loading: boolean;
  followOrganization: () => Promise<void>;
  unfollowOrganization: () => Promise<void>;
  checkFollowStatus: () => Promise<void>;
}

export function useFollowOrganizationEventDriven(organizationId: string): UseFollowOrganizationReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { publish, generateCorrelationId } = useEventPublisher();

  const checkFollowStatus = useCallback(async () => {
    if (!user || !organizationId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', organizationId)
        .eq('following_type', 'organization')
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error in checkFollowStatus:', error);
    }
  }, [user, organizationId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const followOrganization = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow organizations",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(true);

    try {
      const correlationId = generateCorrelationId();

      // Publish event to event bus
      const event = createUserFollowedOrganizationEvent(
        {
          followerId: user.id,
          organizationId,
        },
        correlationId
      );

      await publish(event);

      toast({
        title: "Success",
        description: "Organization followed successfully",
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      console.error('Error following organization:', error);
      toast({
        title: "Error",
        description: "Failed to follow organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, organizationId, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  const unfollowOrganization = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to unfollow organizations",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(false);

    try {
      const correlationId = generateCorrelationId();

      // Publish event to event bus
      const event = createUserUnfollowedOrganizationEvent(
        {
          followerId: user.id,
          organizationId,
        },
        correlationId
      );

      await publish(event);

      toast({
        title: "Success",
        description: "Organization unfollowed successfully",
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      console.error('Error unfollowing organization:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, organizationId, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  return {
    isFollowing,
    loading,
    followOrganization,
    unfollowOrganization,
    checkFollowStatus,
  };
}
