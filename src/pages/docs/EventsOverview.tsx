import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Zap, Database, GitBranch } from "lucide-react";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const EventsOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Event System Overview</h1>
        <p className="text-xl text-muted-foreground">
          Understanding Fundly's event-driven architecture
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Event-Driven Architecture</AlertTitle>
        <AlertDescription>
          Fundly uses a comprehensive event system to track all state changes across the platform.
          Events are immutable, versioned, and provide a complete audit trail.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            What are Domain Events?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Domain events represent significant occurrences within the Fundly platform. Each event is:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Immutable:</strong> Once published, events cannot be changed</li>
            <li><strong>Versioned:</strong> Events follow semantic versioning for backward compatibility</li>
            <li><strong>Timestamped:</strong> Each event includes precise Unix timestamp</li>
            <li><strong>Correlated:</strong> Events can be linked via correlation IDs for tracing</li>
            <li><strong>Validated:</strong> All events are validated against Zod schemas</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Event Domains
          </CardTitle>
          <CardDescription>Events are organized into five domain categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">User Events</h4>
              <p className="text-sm text-muted-foreground">
                Registration, login, profile updates, campaign following
              </p>
              <p className="text-xs text-muted-foreground mt-2">5 event types</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Campaign Events</h4>
              <p className="text-sm text-muted-foreground">
                Creation, updates, deletions, goal reached, status changes
              </p>
              <p className="text-xs text-muted-foreground mt-2">5 event types</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Donation Events</h4>
              <p className="text-sm text-muted-foreground">
                Initiated, completed, failed, refunded
              </p>
              <p className="text-xs text-muted-foreground mt-2">4 event types</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Organization Events</h4>
              <p className="text-sm text-muted-foreground">
                Creation, verification, rejection, updates, deletion
              </p>
              <p className="text-xs text-muted-foreground mt-2">5 event types</p>
            </div>
            <div className="p-4 border rounded-lg md:col-span-2">
              <h4 className="font-semibold mb-2">Admin Events</h4>
              <p className="text-sm text-muted-foreground">
                User management, campaign approval/rejection, featuring
              </p>
              <p className="text-xs text-muted-foreground mt-2">7 event types</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Event Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Hybrid Event Bus</h4>
          <p className="text-muted-foreground">
            The system uses a hybrid approach combining Supabase persistence with optional Redis streaming:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Supabase Event Store:</strong> All events persisted to <code>event_store</code> table</li>
            <li><strong>Redis Streams:</strong> Real-time event distribution (server-side only)</li>
            <li><strong>Edge Functions:</strong> Async event processing via <code>event-processor</code></li>
            <li><strong>Middleware:</strong> Logging, validation, idempotency, circuit breakers</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Structure</CardTitle>
          <CardDescription>All events follow this base structure</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            language="typescript"
            code={`interface DomainEvent<T extends EventPayload> {
  readonly id: string;              // UUID v4
  readonly type: string;             // e.g., 'user.registered'
  readonly timestamp: number;        // Unix timestamp
  readonly version: string;          // Semantic version
  readonly correlationId?: string;   // For event tracing
  readonly causationId?: string;     // Event that caused this
  readonly metadata?: Record<string, any>;
  readonly payload: T;               // Domain-specific data
}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing Events</CardTitle>
          <CardDescription>How to publish events from your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            language="typescript"
            code={`import { globalEventBus, createUserRegisteredEvent } from '@/lib/events';

// Create and publish a user registration event
const event = createUserRegisteredEvent({
  userId: user.id,
  email: user.email,
  registrationMethod: 'email'
}, correlationId);

await globalEventBus.publish(event);

// Batch publishing for performance
await globalEventBus.publishBatch([event1, event2, event3]);`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscribing to Events</CardTitle>
          <CardDescription>How to listen for events in your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            language="typescript"
            code={`import { globalEventBus, UserRegisteredEvent } from '@/lib/events';

// Subscribe to specific event type
const unsubscribe = globalEventBus.subscribe<UserRegisteredEvent>(
  'user.registered',
  {
    eventType: 'user.registered',
    async handle(event) {
      console.log('New user registered:', event.payload.email);
      // Trigger welcome email, analytics, etc.
    }
  }
);

// Unsubscribe when done
unsubscribe();`}
          />
        </CardContent>
      </Card>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Event Replay</AlertTitle>
        <AlertDescription>
          The event store maintains a complete history of all events. You can replay events from any timestamp
          to rebuild state, audit changes, or recover from failures.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EventsOverview;
