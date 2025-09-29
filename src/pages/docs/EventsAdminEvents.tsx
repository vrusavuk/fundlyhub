import { EventSchemaViewer } from "@/components/docs/EventSchemaViewer";
import { eventSpecification } from "@/data/event-specification";

export const EventsAdminEvents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Events</h1>
        <p className="text-xl text-muted-foreground">
          Events triggered by administrative actions and moderation
        </p>
      </div>

      <EventSchemaViewer
        eventName="User Suspended"
        eventType="admin.user_suspended"
        description="Published when an admin suspends a user account"
        payload={eventSpecification.components.messages.UserSuspendedEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Deleted"
        eventType="admin.user_deleted"
        description="Published when an admin deletes a user account"
        payload={eventSpecification.components.messages.UserDeletedEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Role Assigned"
        eventType="admin.user_role_assigned"
        description="Published when an admin changes a user's role"
        payload={eventSpecification.components.messages.UserRoleAssignedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Approved"
        eventType="admin.campaign_approved"
        description="Published when an admin approves a pending campaign"
        payload={eventSpecification.components.messages.CampaignApprovedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Rejected"
        eventType="admin.campaign_rejected"
        description="Published when an admin rejects a campaign submission"
        payload={eventSpecification.components.messages.CampaignRejectedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Featured"
        eventType="admin.campaign_featured"
        description="Published when an admin features a campaign on the homepage"
        payload={eventSpecification.components.messages.CampaignFeaturedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Campaign Unfeatured"
        eventType="admin.campaign_unfeatured"
        description="Published when an admin removes featured status from a campaign"
        payload={eventSpecification.components.messages.CampaignUnfeaturedEvent.payload}
      />
    </div>
  );
};

export default EventsAdminEvents;
