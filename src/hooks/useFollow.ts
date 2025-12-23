/**
 * Unified Follow Hook
 * Consolidates useFollowUserEventDriven and useFollowOrganizationEventDriven
 * Implements optimistic updates and event sourcing
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEventPublisher } from './useEventBus';
import { logger } from '@/lib/services/logger.service';
import {
  createUserFollowedUserEvent,
  createUserUnfollowedUserEvent,
  createUserFollowedOrganizationEvent,
  createUserUnfollowedOrganizationEvent,
} from '@/lib/events/domain/UserEvents';
import { supabase } from '@/integrations/supabase/client';

export type FollowEntityType = 'user' | 'organization';

export interface UseFollowOptions {
  /** Type of entity to follow */
  entityType: FollowEntityType;
  /** ID of the entity to follow */
  entityId: string;
}

export interface UseFollowResult {
  /** Whether the current user is following the entity */
  isFollowing: boolean;
  /** Whether a follow/unfollow operation is in progress */
  loading: boolean;
  /** Follow the entity */
  follow: () => Promise<void>;
  /** Unfollow the entity */
  unfollow: () => Promise<void>;
  /** Toggle follow state */
  toggleFollow: () => Promise<void>;
  /** Refresh the follow status from the server */
  checkFollowStatus: () => Promise<void>;
}

export function useFollow({ entityType, entityId }: UseFollowOptions): UseFollowResult {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { publish, generateCorrelationId } = useEventPublisher();

  // Entity-specific labels for user feedback
  const entityLabel = useMemo(() => 
    entityType === 'user' ? 'user' : 'organization',
    [entityType]
  );

  const checkFollowStatus = useCallback(async () => {
    if (!user || !entityId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', entityId)
        .eq('following_type', entityType)
        .maybeSingle();

      if (error) {
        logger.error('Error checking follow status', error, {
          componentName: 'useFollow',
          operationName: 'checkFollowStatus',
          userId: user.id,
          metadata: { entityType, entityId }
        });
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      logger.error('Error in checkFollowStatus', error as Error, {
        componentName: 'useFollow',
        operationName: 'checkFollowStatus',
        userId: user?.id,
        metadata: { entityType, entityId }
      });
    }
  }, [user, entityId, entityType]);

  // Check follow status on mount and when dependencies change
  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const follow = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `Please sign in to follow ${entityLabel}s`,
        variant: "destructive",
      });
      return;
    }

    // Prevent self-follow for users
    if (entityType === 'user' && user.id === entityId) {
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

      // Create the appropriate event based on entity type
      const event = entityType === 'user'
        ? createUserFollowedUserEvent(
            {
              followerId: user.id,
              followedUserId: entityId,
              followerEmail: user.email,
            },
            correlationId
          )
        : createUserFollowedOrganizationEvent(
            {
              followerId: user.id,
              organizationId: entityId,
            },
            correlationId
          );

      await publish(event);

      toast({
        title: "Success",
        description: `${entityType === 'user' ? 'User' : 'Organization'} followed successfully`,
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      logger.error(`Error following ${entityLabel}`, error as Error, {
        componentName: 'useFollow',
        operationName: 'follow',
        userId: user.id,
        metadata: { entityType, entityId }
      });
      
      toast({
        title: "Error",
        description: `Failed to follow ${entityLabel}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, entityId, entityType, entityLabel, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  const unfollow = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `Please sign in to unfollow ${entityLabel}s`,
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

      // Create the appropriate event based on entity type
      const event = entityType === 'user'
        ? createUserUnfollowedUserEvent(
            {
              followerId: user.id,
              unfollowedUserId: entityId,
            },
            correlationId
          )
        : createUserUnfollowedOrganizationEvent(
            {
              followerId: user.id,
              organizationId: entityId,
            },
            correlationId
          );

      await publish(event);

      toast({
        title: "Success",
        description: `${entityType === 'user' ? 'User' : 'Organization'} unfollowed successfully`,
      });

      // Refresh status to ensure consistency
      await checkFollowStatus();
    } catch (error) {
      // Rollback optimistic update on error
      setIsFollowing(previousState);
      
      logger.error(`Error unfollowing ${entityLabel}`, error as Error, {
        componentName: 'useFollow',
        operationName: 'unfollow',
        userId: user.id,
        metadata: { entityType, entityId }
      });
      
      toast({
        title: "Error",
        description: `Failed to unfollow ${entityLabel}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, entityId, entityType, entityLabel, isFollowing, publish, generateCorrelationId, toast, checkFollowStatus]);

  const toggleFollow = useCallback(async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  }, [isFollowing, follow, unfollow]);

  return {
    isFollowing,
    loading,
    follow,
    unfollow,
    toggleFollow,
    checkFollowStatus,
  };
}

// Convenience hooks for backward compatibility
export function useFollowUser(userId: string): UseFollowResult {
  return useFollow({ entityType: 'user', entityId: userId });
}

export function useFollowOrganization(organizationId: string): UseFollowResult {
  return useFollow({ entityType: 'organization', entityId: organizationId });
}
