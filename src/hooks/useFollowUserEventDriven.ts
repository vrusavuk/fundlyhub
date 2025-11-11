/**
 * Event-Driven Follow User Hook
 * Implements optimistic updates and event sourcing
 * Following Instagram's architecture patterns
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEventPublisher } from './useEventBus';
import { logger } from '@/lib/services/logger.service';
import {
  createUserFollowedUserEvent,
  createUserUnfollowedUserEvent,
} from '@/lib/events/domain/UserEvents';
import { supabase } from '@/integrations/supabase/client';

interface UseFollowUserReturn {
  isFollowing: boolean;
  loading: boolean;
  followUser: () => Promise<void>;
  unfollowUser: () => Promise<void>;
  checkFollowStatus: () => Promise<void>;
}

export function useFollowUserEventDriven(targetUserId: string): UseFollowUserReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { publish, generateCorrelationId } = useEventPublisher();

  const checkFollowStatus = useCallback(async () => {
    if (!user || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .eq('following_type', 'user')
        .maybeSingle();

      if (error) {
        logger.error('Error checking follow status', error, {
          componentName: 'useFollowUserEventDriven',
          operationName: 'checkFollowStatus',
          userId: user.id,
          metadata: { targetUserId }
        });
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      logger.error('Error in checkFollowStatus', error as Error, {
        componentName: 'useFollowUserEventDriven',
        operationName: 'checkFollowStatus',
        userId: user?.id,
        metadata: { targetUserId }
      });
    }
  }, [user, targetUserId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const followUser = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: "Invalid Action",
        description: "You cannot follow yourself",
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
      const event = createUserFollowedUserEvent(
        {
          followerId: user.id,
          followedUserId: targetUserId,
          followerEmail: user.email,
        },
        correlationId
      );

      await publish(event);

      toast({
        title: "Success",
        description: "User followed successfully",
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      logger.error('Error following user', error as Error, {
        componentName: 'useFollowUserEventDriven',
        operationName: 'followUser',
        userId: user.id,
        metadata: { targetUserId }
      });
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  const unfollowUser = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to unfollow users",
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
      const event = createUserUnfollowedUserEvent(
        {
          followerId: user.id,
          unfollowedUserId: targetUserId,
        },
        correlationId
      );

      await publish(event);

      toast({
        title: "Success",
        description: "User unfollowed successfully",
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      logger.error('Error unfollowing user', error as Error, {
        componentName: 'useFollowUserEventDriven',
        operationName: 'unfollowUser',
        userId: user.id,
        metadata: { targetUserId }
      });
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  return {
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    checkFollowStatus,
  };
}
