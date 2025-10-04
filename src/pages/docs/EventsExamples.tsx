export const EventsExamples = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Event Examples</h1>
        <p className="text-xl text-muted-foreground">
          Practical examples of working with FundlyHub's event system
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Publishing Events (Frontend)</h2>
        <p className="text-muted-foreground mb-4">
          How to publish domain events from your React components:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Example 1: Publishing a Follow User Event</h3>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
              <code>{`import { globalEventBus } from '@/lib/events';
import { createUserFollowedUserEvent } from '@/lib/events/domain/UserEvents';

const handleFollowUser = async (followedUserId: string) => {
  try {
    // Create the event
    const event = createUserFollowedUserEvent({
      followerId: currentUserId,
      followedUserId: followedUserId,
      followerEmail: 'user@example.com',
      followedUserEmail: 'followed@example.com',
    });

    // Publish to event bus
    await globalEventBus.publish(event);
    
    toast.success('User followed successfully');
  } catch (error) {
    console.error('Failed to follow user:', error);
    toast.error('Failed to follow user');
  }
};`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Example 2: Publishing a Campaign Created Event</h3>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
              <code>{`import { globalEventBus } from '@/lib/events';
import { createCampaignCreatedEvent } from '@/lib/events/domain/CampaignEvents';

const handleCreateCampaign = async (campaignData: any) => {
  try {
    // First, create the campaign in the database
    const { data: campaign, error } = await supabase
      .from('fundraisers')
      .insert(campaignData)
      .select()
      .single();

    if (error) throw error;

    // Then publish the event
    const event = createCampaignCreatedEvent({
      campaignId: campaign.id,
      title: campaign.title,
      ownerId: campaign.owner_user_id,
      goalAmount: campaign.goal_amount,
      categoryId: campaign.category_id,
      slug: campaign.slug,
    });

    await globalEventBus.publish(event);
    
    toast.success('Campaign created successfully');
    navigate(\`/campaigns/\${campaign.slug}\`);
  } catch (error) {
    console.error('Failed to create campaign:', error);
    toast.error('Failed to create campaign');
  }
};`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Example 3: Publishing Multiple Events (Batch)</h3>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
              <code>{`import { globalEventBus } from '@/lib/events';
import { 
  createUserFollowedUserEvent,
  createUserFollowedOrganizationEvent 
} from '@/lib/events/domain/UserEvents';

const handleBulkFollow = async (userIds: string[], orgIds: string[]) => {
  try {
    const events = [
      ...userIds.map(id => createUserFollowedUserEvent({
        followerId: currentUserId,
        followedUserId: id,
      })),
      ...orgIds.map(id => createUserFollowedOrganizationEvent({
        followerId: currentUserId,
        organizationId: id,
      })),
    ];

    // Publish all events in a batch
    await globalEventBus.publishBatch(events);
    
    toast.success(\`Followed \${events.length} accounts\`);
  } catch (error) {
    console.error('Failed to follow accounts:', error);
    toast.error('Failed to follow some accounts');
  }
};`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Subscribing to Events</h2>
        <p className="text-muted-foreground mb-4">
          How to listen for and react to events in your application:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Example 1: Simple Event Subscriber</h3>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
              <code>{`import { globalEventBus } from '@/lib/events';
import { UserFollowedUserEvent } from '@/lib/events/domain/UserEvents';

// In a React component or hook
useEffect(() => {
  const handler = {
    eventType: 'user.followed_user',
    handle: async (event: UserFollowedUserEvent) => {
      console.log('User followed:', event.payload);
      
      // Update UI, send notification, etc.
      showNotification({
        title: 'New Follower',
        message: \`\${event.payload.followerEmail} followed you\`,
      });
    },
  };

  // Subscribe to the event
  const unsubscribe = globalEventBus.subscribe('user.followed_user', handler);

  // Cleanup on unmount
  return () => unsubscribe();
}, []);`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Example 2: Multiple Event Subscriber</h3>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
              <code>{`import { globalEventBus } from '@/lib/events';
import { EventHandler } from '@/lib/events/types';

class NotificationHandler implements EventHandler {
  readonly eventType = 'user.*';

  async handle(event: any): Promise<void> {
    switch (event.type) {
      case 'user.followed_user':
        this.handleFollowed(event);
        break;
      case 'user.unfollowed_user':
        this.handleUnfollowed(event);
        break;
      case 'user.profile_updated':
        this.handleProfileUpdate(event);
        break;
    }
  }

  private handleFollowed(event: any) {
    console.log('New follower:', event.payload.followerId);
  }

  private handleUnfollowed(event: any) {
    console.log('Lost follower:', event.payload.followerId);
  }

  private handleProfileUpdate(event: any) {
    console.log('Profile updated:', event.payload.userId);
  }
}

// Register the handler
const handler = new NotificationHandler();
globalEventBus.subscribe('user.followed_user', handler);
globalEventBus.subscribe('user.unfollowed_user', handler);
globalEventBus.subscribe('user.profile_updated', handler);`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Creating Custom Processors</h2>
        <p className="text-muted-foreground mb-4">
          How to create your own event processor with idempotency:
        </p>

        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`import { EventHandler, DomainEvent } from '@/lib/events/types';
import { eventIdempotency } from '@/lib/events/EventIdempotency';
import { supabase } from '@/integrations/supabase/client';

/**
 * Email Notification Processor
 * Sends email notifications when users are followed
 */
export class EmailNotificationProcessor implements EventHandler {
  readonly eventType = 'user.followed_user';

  async handle(event: DomainEvent): Promise<void> {
    // Check idempotency to prevent duplicate emails
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id, 
      'EmailNotificationProcessor'
    );
    
    if (!shouldProcess) {
      console.log(\`[EmailNotificationProcessor] Skipping duplicate event \${event.id}\`);
      return;
    }

    try {
      // Get user details
      const { data: user, error } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', event.payload.followedUserId)
        .single();

      if (error) throw error;

      // Send email (using edge function or external service)
      await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: 'You have a new follower!',
          template: 'new-follower',
          data: {
            userName: user.name,
            followerEmail: event.payload.followerEmail,
          },
        },
      });

      // Mark as complete
      await eventIdempotency.markComplete(event.id, 'EmailNotificationProcessor');
      
      console.log(\`[EmailNotificationProcessor] Email sent for event \${event.id}\`);
    } catch (error) {
      console.error('[EmailNotificationProcessor] Error:', error);
      
      // Mark as failed
      await eventIdempotency.markFailed(
        event.id, 
        'EmailNotificationProcessor', 
        error.message
      );
      
      // Don't throw - email is not critical
    }
  }
}

// Register the processor
const emailProcessor = new EmailNotificationProcessor();
globalEventBus.subscribe('user.followed_user', emailProcessor);`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Event Replay</h2>
        <p className="text-muted-foreground mb-4">
          How to replay events from the event store (useful for rebuilding projections):
        </p>

        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`import { globalEventBus } from '@/lib/events';

/**
 * Replay all events from a specific timestamp
 * Useful for rebuilding projections or recovering from failures
 */
const replayEvents = async (fromTimestamp?: number) => {
  try {
    console.log('Starting event replay...');
    
    // Replay events through the event bus
    await globalEventBus.replay(fromTimestamp);
    
    console.log('Event replay completed successfully');
  } catch (error) {
    console.error('Event replay failed:', error);
    throw error;
  }
};

// Replay all events
await replayEvents();

// Replay events from last 24 hours
const yesterday = Date.now() - (24 * 60 * 60 * 1000);
await replayEvents(yesterday);`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Testing Events</h2>
        <p className="text-muted-foreground mb-4">
          How to test event publishing and handling in your tests:
        </p>

        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`import { describe, it, expect, vi } from 'vitest';
import { globalEventBus } from '@/lib/events';
import { createUserFollowedUserEvent } from '@/lib/events/domain/UserEvents';

describe('Follow User Flow', () => {
  it('should publish follow event when user follows another user', async () => {
    // Spy on event bus
    const publishSpy = vi.spyOn(globalEventBus, 'publish');

    // Create event
    const event = createUserFollowedUserEvent({
      followerId: 'user-1',
      followedUserId: 'user-2',
    });

    // Publish event
    await globalEventBus.publish(event);

    // Assert
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'user.followed_user',
        payload: expect.objectContaining({
          followerId: 'user-1',
          followedUserId: 'user-2',
        }),
      })
    );
  });

  it('should handle follow event correctly', async () => {
    let handledEvent = null;

    const handler = {
      eventType: 'user.followed_user',
      handle: async (event: any) => {
        handledEvent = event;
      },
    };

    // Subscribe
    globalEventBus.subscribe('user.followed_user', handler);

    // Publish event
    const event = createUserFollowedUserEvent({
      followerId: 'user-1',
      followedUserId: 'user-2',
    });
    await globalEventBus.publish(event);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(handledEvent).not.toBeNull();
    expect(handledEvent.type).toBe('user.followed_user');
  });
});`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Edge Function Event Processing</h2>
        <p className="text-muted-foreground mb-4">
          Example edge function that processes events from Redis Upstash:
        </p>

        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`// supabase/functions/event-processor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Parse event from Redis
    const { events } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Process each event
    for (const redisEvent of events) {
      const event = JSON.parse(redisEvent.data);
      
      console.log(\`Processing event: \${event.type}\`);

      // Check idempotency
      const { data: existing } = await supabase
        .from('event_processing_status')
        .select('status')
        .eq('event_id', event.id)
        .eq('processor_name', 'EdgeFunctionProcessor')
        .single();

      if (existing?.status === 'completed') {
        console.log('Event already processed, skipping');
        continue;
      }

      // Process based on event type
      switch (event.type) {
        case 'user.followed_user':
          await processFollowUser(supabase, event);
          break;
        case 'campaign.created':
          await processCampaignCreated(supabase, event);
          break;
        // Add more event handlers...
      }

      // Mark as complete
      await supabase
        .from('event_processing_status')
        .upsert({
          event_id: event.id,
          processor_name: 'EdgeFunctionProcessor',
          status: 'completed',
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Always use correlation IDs to track related events</li>
          <li>Include relevant metadata in event payloads</li>
          <li>Validate event payloads using Zod schemas before publishing</li>
          <li>Handle errors gracefully in event handlers</li>
          <li>Use idempotency for all side effects</li>
          <li>Don't block the main flow for non-critical events</li>
          <li>Log all event processing for debugging</li>
          <li>Test event flows thoroughly before deploying</li>
        </ul>
      </section>
    </div>
  );
};

export default EventsExamples;