import { EventSchemaViewer } from "@/components/docs/EventSchemaViewer";
import { eventSpecification } from "@/data/event-specification";

export const EventsDonationEvents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Donation Events</h1>
        <p className="text-xl text-muted-foreground">
          Events tracking the donation payment lifecycle
        </p>
      </div>

      <EventSchemaViewer
        eventName="Donation Initiated"
        eventType="donation.initiated"
        description="Published when a donor starts the donation process"
        payload={eventSpecification.components.messages.DonationInitiatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Donation Completed"
        eventType="donation.completed"
        description="Published when a donation payment is successfully processed"
        payload={eventSpecification.components.messages.DonationCompletedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Donation Failed"
        eventType="donation.failed"
        description="Published when a donation payment fails or is declined"
        payload={eventSpecification.components.messages.DonationFailedEvent.payload}
      />

      <EventSchemaViewer
        eventName="Donation Refunded"
        eventType="donation.refunded"
        description="Published when a donation is refunded to the donor"
        payload={eventSpecification.components.messages.DonationRefundedEvent.payload}
      />
    </div>
  );
};

export default EventsDonationEvents;
