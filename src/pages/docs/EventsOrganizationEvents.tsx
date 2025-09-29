import { EventSchemaViewer } from "@/components/docs/EventSchemaViewer";
import { eventSpecification } from "@/data/event-specification";

export const EventsOrganizationEvents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Organization Events</h1>
        <p className="text-xl text-muted-foreground">
          Events related to nonprofit organization management and verification
        </p>
      </div>

      <EventSchemaViewer
        eventName="Organization Created"
        eventType="organization.created"
        description="Published when a new organization profile is created"
        payload={eventSpecification.components.messages.OrganizationCreatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Organization Verified"
        eventType="organization.verified"
        description="Published when an organization is verified as a legitimate nonprofit"
        payload={eventSpecification.components.messages.OrganizationVerifiedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Organization Rejected"
        eventType="organization.rejected"
        description="Published when an organization verification is rejected"
        payload={eventSpecification.components.messages.OrganizationRejectedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Organization Updated"
        eventType="organization.updated"
        description="Published when organization details are modified"
        payload={eventSpecification.components.messages.OrganizationUpdatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Organization Deleted"
        eventType="organization.deleted"
        description="Published when an organization profile is deleted"
        payload={eventSpecification.components.messages.OrganizationDeletedEvent.payload}
      />
    </div>
  );
};

export default EventsOrganizationEvents;
