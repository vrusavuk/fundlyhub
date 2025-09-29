import { EventSchemaViewer } from "@/components/docs/EventSchemaViewer";
import { eventSpecification } from "@/data/event-specification";

export const EventsCampaignEvents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Campaign Events</h1>
        <p className="text-xl text-muted-foreground">
          Events related to fundraising campaign lifecycle and management
        </p>
      </div>

      <EventSchemaViewer
        eventName="Campaign Created"
        eventType="campaign.created"
        description="Published when a new fundraising campaign is created"
        payload={eventSpecification.components.messages.CampaignCreatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Updated"
        eventType="campaign.updated"
        description="Published when campaign details are modified"
        payload={eventSpecification.components.messages.CampaignUpdatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Deleted"
        eventType="campaign.deleted"
        description="Published when a campaign is deleted or removed"
        payload={eventSpecification.components.messages.CampaignDeletedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Goal Reached"
        eventType="campaign.goal_reached"
        description="Published when a campaign reaches its funding goal"
        payload={eventSpecification.components.messages.CampaignGoalReachedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Status Changed"
        eventType="campaign.status_changed"
        description="Published when campaign status transitions (e.g., draft → active → completed)"
        payload={eventSpecification.components.messages.CampaignStatusChangedEvent.payload}
      />
    </div>
  );
};

export default EventsCampaignEvents;
