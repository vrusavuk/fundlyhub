export const EventsProcessors = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Event Processors</h1>
        <p className="text-xl text-muted-foreground">
          Understanding the event processing architecture and how processors handle domain events
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-muted-foreground">
          FundlyHub uses an event-driven architecture with specialized processors that handle domain events.
          Each processor follows the Single Responsibility Principle and handles specific aspects of event processing.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Processor Types</h2>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">1. Write Processors</h3>
            <p className="text-muted-foreground mb-3">
              Handle primary writes to the main tables (Command side of CQRS).
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>CampaignWriteProcessor</strong>: Processes campaign.created and campaign.updated events</li>
              <li><strong>SubscriptionWriteProcessor</strong>: Handles user follow events (user.followed_user, user.followed_organization)</li>
              <li><strong>SubscriptionDeleteProcessor</strong>: Handles user unfollow events (user.unfollowed_user, user.unfollowed_organization)</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">2. Projection Processors</h3>
            <p className="text-muted-foreground mb-3">
              Maintain denormalized read-optimized views (Query side of CQRS).
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>CampaignProjectionProcessor</strong>: Updates campaign_summary_projection, campaign_stats_projection, and campaign_search_projection</li>
              <li><strong>CountProjectionProcessor</strong>: Updates follower/following counts in profiles table</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">3. Activity Feed Processors</h3>
            <p className="text-muted-foreground mb-3">
              Create activity feed entries for social features.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>ActivityFeedProcessor</strong>: Writes follow activities to user_activities table</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">4. Role Processors</h3>
            <p className="text-muted-foreground mb-3">
              Handle role assignments and permissions.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>CampaignRoleProcessor</strong>: Assigns organizer role when users create campaigns</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Event Processing Flow</h2>
        <p className="text-muted-foreground mb-4">
          Events flow through the system from creation to processing: User actions create domain events, 
          which are validated, stored, and then routed to specialized processors via Redis Upstash (production) 
          or in-memory bus (development). Each processor handles its responsibility independently with idempotency checks.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Idempotency</h2>
        <p className="text-muted-foreground">
          All processors implement idempotency to ensure events are processed exactly once, even if they're received multiple times.
        </p>
        
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">How It Works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Before processing, check if event ID exists in event_processing_status table</li>
            <li>If exists and status is 'completed', skip processing</li>
            <li>If new, mark as 'processing' and proceed</li>
            <li>After successful processing, mark as 'completed'</li>
            <li>If error occurs, mark as 'failed' and send to dead letter queue</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Circuit Breaker Pattern</h2>
        <p className="text-muted-foreground">
          The circuit breaker prevents cascading failures when external services are unavailable.
        </p>
        
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">States:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Closed</strong>: Normal operation, all requests pass through</li>
            <li><strong>Open</strong>: Too many failures, reject requests immediately</li>
            <li><strong>Half-Open</strong>: Testing if service recovered, allow limited requests</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dead Letter Queue</h2>
        <p className="text-muted-foreground">
          Failed events are sent to the dead letter queue for manual inspection and replay.
        </p>
        
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Features:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Stores failed events with error details</li>
            <li>Tracks failure count and timestamps</li>
            <li>Supports manual replay through admin interface</li>
            <li>Prevents data loss from processing failures</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Processor Registration</h2>
        <p className="text-muted-foreground">
          Processors are registered in <code>src/lib/events/index.ts</code> and subscribe to specific event types:
        </p>
        
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`// Campaign processors
const campaignWriter = new CampaignWriteProcessor();
const campaignProjector = new CampaignProjectionProcessor();
const campaignRoleAssigner = new CampaignRoleProcessor();

globalEventBus.subscribe('campaign.created', campaignWriter);
globalEventBus.subscribe('campaign.updated', campaignWriter);
globalEventBus.subscribe('campaign.*', campaignProjector);
globalEventBus.subscribe('campaign.created', campaignRoleAssigner);

// Subscription processors
const subscriptionWriter = new SubscriptionWriteProcessor();
const subscriptionDeleter = new SubscriptionDeleteProcessor();
const activityFeedWriter = new ActivityFeedProcessor();
const countUpdater = new CountProjectionProcessor();

globalEventBus.subscribe('user.followed_user', subscriptionWriter);
globalEventBus.subscribe('user.followed_organization', subscriptionWriter);
globalEventBus.subscribe('user.unfollowed_user', subscriptionDeleter);
globalEventBus.subscribe('user.unfollowed_organization', subscriptionDeleter);`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Edge Function Integration</h2>
        <p className="text-muted-foreground">
          Two edge functions handle event processing in production:
        </p>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">event-processor</h3>
            <p className="text-muted-foreground">
              General-purpose event processor that handles all domain events from Redis Upstash.
              Invoked by Redis stream triggers.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">campaign-processor</h3>
            <p className="text-muted-foreground">
              Specialized processor for campaign-related events including saga orchestration for campaign creation.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Each processor should handle one responsibility</li>
          <li>Always implement idempotency checks</li>
          <li>Log all processing steps for debugging</li>
          <li>Use circuit breakers for external service calls</li>
          <li>Non-critical processors (like activity feed) should not throw errors</li>
          <li>Update projections asynchronously for eventual consistency</li>
        </ul>
      </section>
    </div>
  );
};

export default EventsProcessors;