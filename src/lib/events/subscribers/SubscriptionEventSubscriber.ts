/**
 * Subscription Event Subscriber
 * Handles follow/unfollow events using CQRS and Idempotency patterns
 * Inspired by Instagram's social graph architecture
 */

import { EventHandler } from '../types';
import { 
  UserFollowedUserEvent,
  UserUnfollowedUserEvent,
  UserFollowedOrganizationEvent,
  UserUnfollowedOrganizationEvent
} from '../domain/UserEvents';
import { supabase } from '@/integrations/supabase/client';
import { eventIdempotency } from '../EventIdempotency';

/**
 * Subscription Write Processor
 * Handles idempotent writes to subscriptions table
 * Single Responsibility: Write to subscriptions table only
 */
export class SubscriptionWriteProcessor implements EventHandler<UserFollowedUserEvent | UserFollowedOrganizationEvent> {
  readonly eventType = 'user.followed_*';

  async handle(event: UserFollowedUserEvent | UserFollowedOrganizationEvent): Promise<void> {
    // Check idempotency to prevent duplicate processing
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'SubscriptionWriteProcessor');
    if (!shouldProcess) {
      console.log(`[SubscriptionWriteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      let followerId: string;
      let followingId: string;
      let followingType: 'user' | 'organization';

      if (event.type === 'user.followed_user') {
        followerId = event.payload.followerId;
        followingId = event.payload.followedUserId;
        followingType = 'user';
      } else {
        followerId = event.payload.followerId;
        followingId = event.payload.organizationId;
        followingType = 'organization';
      }

      // Idempotent insert - only insert if doesn't exist
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            follower_id: followerId,
            following_id: followingId,
            following_type: followingType,
          },
          {
            onConflict: 'follower_id,following_id,following_type',
            ignoreDuplicates: true,
          }
        );

      if (error) {
        console.error('[SubscriptionWriteProcessor] Error writing subscription:', error);
        await eventIdempotency.markFailed(event.id, 'SubscriptionWriteProcessor', error.message);
        throw error;
      }

      await eventIdempotency.markComplete(event.id, 'SubscriptionWriteProcessor');
      console.log(`[SubscriptionWriteProcessor] Successfully processed follow event ${event.id}`);
    } catch (error) {
      console.error('[SubscriptionWriteProcessor] Failed to process event:', error);
      throw error;
    }
  }
}

/**
 * Subscription Delete Processor
 * Handles idempotent deletes from subscriptions table
 */
export class SubscriptionDeleteProcessor implements EventHandler<UserUnfollowedUserEvent | UserUnfollowedOrganizationEvent> {
  readonly eventType = 'user.unfollowed_*';

  async handle(event: UserUnfollowedUserEvent | UserUnfollowedOrganizationEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'SubscriptionDeleteProcessor');
    if (!shouldProcess) {
      console.log(`[SubscriptionDeleteProcessor] Skipping duplicate event ${event.id}`);
      return;
    }

    try {
      let followerId: string;
      let followingId: string;
      let followingType: 'user' | 'organization';

      if (event.type === 'user.unfollowed_user') {
        followerId = event.payload.followerId;
        followingId = event.payload.unfollowedUserId;
        followingType = 'user';
      } else {
        followerId = event.payload.followerId;
        followingId = event.payload.organizationId;
        followingType = 'organization';
      }

      // Idempotent delete - doesn't fail if already deleted
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .eq('following_type', followingType);

      if (error) {
        console.error('[SubscriptionDeleteProcessor] Error deleting subscription:', error);
        await eventIdempotency.markFailed(event.id, 'SubscriptionDeleteProcessor', error.message);
        throw error;
      }

      await eventIdempotency.markComplete(event.id, 'SubscriptionDeleteProcessor');
      console.log(`[SubscriptionDeleteProcessor] Successfully processed unfollow event ${event.id}`);
    } catch (error) {
      console.error('[SubscriptionDeleteProcessor] Failed to process event:', error);
      throw error;
    }
  }
}

/**
 * Activity Feed Processor
 * Writes follow activities to user_activities table
 * Enables social feed features
 */
export class ActivityFeedProcessor implements EventHandler<UserFollowedUserEvent | UserFollowedOrganizationEvent> {
  readonly eventType = 'user.followed_*';

  async handle(event: UserFollowedUserEvent | UserFollowedOrganizationEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'ActivityFeedProcessor');
    if (!shouldProcess) return;

    try {
      let actorId: string;
      let targetId: string;
      let targetType: 'user' | 'organization';

      if (event.type === 'user.followed_user') {
        actorId = event.payload.followerId;
        targetId = event.payload.followedUserId;
        targetType = 'user';
      } else {
        actorId = event.payload.followerId;
        targetId = event.payload.organizationId;
        targetType = 'organization';
      }

      const { error } = await supabase
        .from('user_activities')
        .insert({
          actor_id: actorId,
          activity_type: 'followed',
          target_type: targetType,
          target_id: targetId,
          metadata: {
            event_id: event.id,
            correlation_id: event.correlationId,
          },
        });

      if (error) {
        console.error('[ActivityFeedProcessor] Error writing activity:', error);
        await eventIdempotency.markFailed(event.id, 'ActivityFeedProcessor', error.message);
        // Don't throw - activity feed is not critical
        return;
      }

      await eventIdempotency.markComplete(event.id, 'ActivityFeedProcessor');
    } catch (error) {
      console.error('[ActivityFeedProcessor] Failed to process event:', error);
      // Don't throw - activity feed is not critical
    }
  }
}

/**
 * Count Projection Processor
 * Updates denormalized follower/following counts
 * Eventually consistent - doesn't block main flow
 */
export class CountProjectionProcessor implements EventHandler {
  readonly eventType = 'user.*';

  async handle(event: UserFollowedUserEvent | UserUnfollowedUserEvent | UserFollowedOrganizationEvent | UserUnfollowedOrganizationEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(event.id, 'CountProjectionProcessor');
    if (!shouldProcess) return;

    try {
      let followerId: string;

      if ('followerId' in event.payload) {
        followerId = event.payload.followerId;
      } else {
        return;
      }

      // Update follower's following_count
      const { count: followingCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', followerId);

      await supabase
        .from('profiles')
        .update({ following_count: followingCount || 0 })
        .eq('id', followerId);

      // Update followed user's follower_count (only for user follows)
      if (event.type === 'user.followed_user' || event.type === 'user.unfollowed_user') {
        const followedUserId = event.type === 'user.followed_user' 
          ? event.payload.followedUserId 
          : event.payload.unfollowedUserId;

        const { count: followerCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', followedUserId)
          .eq('following_type', 'user');

        await supabase
          .from('profiles')
          .update({ follower_count: followerCount || 0 })
          .eq('id', followedUserId);
      }

      await eventIdempotency.markComplete(event.id, 'CountProjectionProcessor');
    } catch (error) {
      console.error('[CountProjectionProcessor] Failed to update counts:', error);
      // Don't throw - counts are eventually consistent
    }
  }
}

/**
 * Initialize all subscription event subscribers
 */
export function initializeSubscriptionSubscribers(eventBus: any) {
  const subscriptionWriter = new SubscriptionWriteProcessor();
  const subscriptionDeleter = new SubscriptionDeleteProcessor();
  const activityFeedWriter = new ActivityFeedProcessor();
  const countUpdater = new CountProjectionProcessor();

  // Subscribe to follow events
  eventBus.subscribe('user.followed_user', subscriptionWriter);
  eventBus.subscribe('user.followed_organization', subscriptionWriter);
  eventBus.subscribe('user.followed_user', activityFeedWriter);
  eventBus.subscribe('user.followed_organization', activityFeedWriter);

  // Subscribe to unfollow events
  eventBus.subscribe('user.unfollowed_user', subscriptionDeleter);
  eventBus.subscribe('user.unfollowed_organization', subscriptionDeleter);

  // Subscribe to all events for count updates
  eventBus.subscribe('user.followed_user', countUpdater);
  eventBus.subscribe('user.unfollowed_user', countUpdater);
  eventBus.subscribe('user.followed_organization', countUpdater);
  eventBus.subscribe('user.unfollowed_organization', countUpdater);

  console.log('[SubscriptionSubscribers] Initialized all subscription event processors');
}
