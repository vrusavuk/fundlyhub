import { EventSchemaViewer } from "@/components/docs/EventSchemaViewer";
import { eventSpecification } from "@/data/event-specification";

export const EventsUserEvents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">User Events</h1>
        <p className="text-xl text-muted-foreground">
          Events related to user registration, authentication, and profile management
        </p>
      </div>

      <EventSchemaViewer
        eventName="User Registered"
        eventType="user.registered"
        description="Published when a new user successfully registers on the platform"
        payload={eventSpecification.components.messages.UserRegisteredEvent.payload}
        example={eventSpecification.components.messages.UserRegisteredEvent.examples?.[0]?.payload}
      />

      <EventSchemaViewer
        eventName="User Logged In"
        eventType="user.logged_in"
        description="Published when a user successfully logs into the platform"
        payload={eventSpecification.components.messages.UserLoggedInEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Profile Updated"
        eventType="user.profile_updated"
        description="Published when a user updates their profile information"
        payload={eventSpecification.components.messages.UserProfileUpdatedEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Campaign Followed"
        eventType="user.campaign_followed"
        description="Published when a user follows a campaign for updates"
        payload={eventSpecification.components.messages.UserCampaignFollowedEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Campaign Unfollowed"
        eventType="user.campaign_unfollowed"
        description="Published when a user unfollows a campaign"
        payload={eventSpecification.components.messages.UserCampaignUnfollowedEvent.payload}
      />

      <EventSchemaViewer
        eventName="User Followed User"
        eventType="user.followed_user"
        description="Published when a user follows another user on the platform"
        payload={eventSpecification.components.messages.UserFollowedUserEvent.payload}
        example={eventSpecification.components.messages.UserFollowedUserEvent.examples?.[0]?.payload}
      />

      <EventSchemaViewer
        eventName="User Unfollowed User"
        eventType="user.unfollowed_user"
        description="Published when a user unfollows another user on the platform"
        payload={eventSpecification.components.messages.UserUnfollowedUserEvent.payload}
        example={eventSpecification.components.messages.UserUnfollowedUserEvent.examples?.[0]?.payload}
      />

      <EventSchemaViewer
        eventName="User Followed Organization"
        eventType="user.followed_organization"
        description="Published when a user follows an organization on the platform"
        payload={eventSpecification.components.messages.UserFollowedOrganizationEvent.payload}
        example={eventSpecification.components.messages.UserFollowedOrganizationEvent.examples?.[0]?.payload}
      />

      <EventSchemaViewer
        eventName="User Unfollowed Organization"
        eventType="user.unfollowed_organization"
        description="Published when a user unfollows an organization on the platform"
        payload={eventSpecification.components.messages.UserUnfollowedOrganizationEvent.payload}
        example={eventSpecification.components.messages.UserUnfollowedOrganizationEvent.examples?.[0]?.payload}
      />
    </div>
  );
};

export default EventsUserEvents;
