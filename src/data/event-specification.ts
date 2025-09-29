/**
 * AsyncAPI 2.6.0 Event Specification
 * Documents all domain events in the application
 */

export const eventSpecification = {
  asyncapi: '2.6.0',
  info: {
    title: 'Fundly Event System',
    version: '1.0.0',
    description: 'Event-driven architecture documentation for the Fundly platform. All events are published through a hybrid event bus with Supabase persistence and Redis streaming.',
  },
  servers: {
    production: {
      url: 'supabase://sgcaqrtnxqhrrqzxmupa',
      protocol: 'supabase',
      description: 'Production event store',
    },
  },
  channels: {
    'user.registered': {
      description: 'User registration events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserRegisteredEvent',
        },
      },
    },
    'user.logged_in': {
      description: 'User login events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserLoggedInEvent',
        },
      },
    },
    'user.profile_updated': {
      description: 'User profile update events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserProfileUpdatedEvent',
        },
      },
    },
    'user.campaign_followed': {
      description: 'User follows campaign events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserCampaignFollowedEvent',
        },
      },
    },
    'user.campaign_unfollowed': {
      description: 'User unfollows campaign events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserCampaignUnfollowedEvent',
        },
      },
    },
    'campaign.created': {
      description: 'Campaign creation events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignCreatedEvent',
        },
      },
    },
    'campaign.updated': {
      description: 'Campaign update events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignUpdatedEvent',
        },
      },
    },
    'campaign.deleted': {
      description: 'Campaign deletion events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignDeletedEvent',
        },
      },
    },
    'campaign.goal_reached': {
      description: 'Campaign goal reached events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignGoalReachedEvent',
        },
      },
    },
    'campaign.status_changed': {
      description: 'Campaign status change events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignStatusChangedEvent',
        },
      },
    },
    'donation.initiated': {
      description: 'Donation initiation events',
      subscribe: {
        message: {
          $ref: '#/components/messages/DonationInitiatedEvent',
        },
      },
    },
    'donation.completed': {
      description: 'Donation completion events',
      subscribe: {
        message: {
          $ref: '#/components/messages/DonationCompletedEvent',
        },
      },
    },
    'donation.failed': {
      description: 'Donation failure events',
      subscribe: {
        message: {
          $ref: '#/components/messages/DonationFailedEvent',
        },
      },
    },
    'donation.refunded': {
      description: 'Donation refund events',
      subscribe: {
        message: {
          $ref: '#/components/messages/DonationRefundedEvent',
        },
      },
    },
    'organization.created': {
      description: 'Organization creation events',
      subscribe: {
        message: {
          $ref: '#/components/messages/OrganizationCreatedEvent',
        },
      },
    },
    'organization.verified': {
      description: 'Organization verification events',
      subscribe: {
        message: {
          $ref: '#/components/messages/OrganizationVerifiedEvent',
        },
      },
    },
    'organization.rejected': {
      description: 'Organization rejection events',
      subscribe: {
        message: {
          $ref: '#/components/messages/OrganizationRejectedEvent',
        },
      },
    },
    'organization.updated': {
      description: 'Organization update events',
      subscribe: {
        message: {
          $ref: '#/components/messages/OrganizationUpdatedEvent',
        },
      },
    },
    'organization.deleted': {
      description: 'Organization deletion events',
      subscribe: {
        message: {
          $ref: '#/components/messages/OrganizationDeletedEvent',
        },
      },
    },
    'admin.user_suspended': {
      description: 'User suspension events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserSuspendedEvent',
        },
      },
    },
    'admin.user_deleted': {
      description: 'User deletion events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserDeletedEvent',
        },
      },
    },
    'admin.user_role_assigned': {
      description: 'User role assignment events',
      subscribe: {
        message: {
          $ref: '#/components/messages/UserRoleAssignedEvent',
        },
      },
    },
    'admin.campaign_approved': {
      description: 'Campaign approval events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignApprovedEvent',
        },
      },
    },
    'admin.campaign_rejected': {
      description: 'Campaign rejection events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignRejectedEvent',
        },
      },
    },
    'admin.campaign_featured': {
      description: 'Campaign featured events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignFeaturedEvent',
        },
      },
    },
    'admin.campaign_unfeatured': {
      description: 'Campaign unfeatured events',
      subscribe: {
        message: {
          $ref: '#/components/messages/CampaignUnfeaturedEvent',
        },
      },
    },
  },
  components: {
    messages: {
      UserRegisteredEvent: {
        name: 'UserRegisteredEvent',
        title: 'User Registered',
        summary: 'Published when a new user registers',
        payload: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Event ID' },
            type: { type: 'string', const: 'user.registered' },
            timestamp: { type: 'number', description: 'Unix timestamp' },
            version: { type: 'string', example: '1.0.0' },
            correlationId: { type: 'string', format: 'uuid' },
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                registrationMethod: { type: 'string', enum: ['email', 'google', 'oauth'] },
              },
              required: ['userId', 'email', 'registrationMethod'],
            },
          },
        },
        examples: [{
          payload: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            type: 'user.registered',
            timestamp: 1704067200000,
            version: '1.0.0',
            correlationId: '660e8400-e29b-41d4-a716-446655440001',
            payload: {
              userId: '770e8400-e29b-41d4-a716-446655440002',
              email: 'user@example.com',
              registrationMethod: 'email',
            },
          },
        }],
      },
      UserLoggedInEvent: {
        name: 'UserLoggedInEvent',
        title: 'User Logged In',
        summary: 'Published when a user logs in',
        payload: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', const: 'user.logged_in' },
            timestamp: { type: 'number' },
            version: { type: 'string' },
            correlationId: { type: 'string', format: 'uuid' },
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                loginMethod: { type: 'string', enum: ['email', 'google', 'oauth'] },
                ipAddress: { type: 'string' },
              },
              required: ['userId', 'loginMethod'],
            },
          },
        },
      },
      UserProfileUpdatedEvent: {
        name: 'UserProfileUpdatedEvent',
        title: 'User Profile Updated',
        summary: 'Published when user updates their profile',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                changes: { type: 'object' },
              },
            },
          },
        },
      },
      UserCampaignFollowedEvent: {
        name: 'UserCampaignFollowedEvent',
        title: 'User Followed Campaign',
        summary: 'Published when user follows a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                campaignId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      UserCampaignUnfollowedEvent: {
        name: 'UserCampaignUnfollowedEvent',
        title: 'User Unfollowed Campaign',
        summary: 'Published when user unfollows a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                campaignId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      CampaignCreatedEvent: {
        name: 'CampaignCreatedEvent',
        title: 'Campaign Created',
        summary: 'Published when a new campaign is created',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                createdBy: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                goalAmount: { type: 'number' },
                category: { type: 'string' },
              },
            },
          },
        },
      },
      CampaignUpdatedEvent: {
        name: 'CampaignUpdatedEvent',
        title: 'Campaign Updated',
        summary: 'Published when campaign is updated',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
                changes: { type: 'object' },
              },
            },
          },
        },
      },
      CampaignDeletedEvent: {
        name: 'CampaignDeletedEvent',
        title: 'Campaign Deleted',
        summary: 'Published when campaign is deleted',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                deletedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      CampaignGoalReachedEvent: {
        name: 'CampaignGoalReachedEvent',
        title: 'Campaign Goal Reached',
        summary: 'Published when campaign reaches funding goal',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                goalAmount: { type: 'number' },
                totalRaised: { type: 'number' },
                reachedAt: { type: 'number' },
              },
            },
          },
        },
      },
      CampaignStatusChangedEvent: {
        name: 'CampaignStatusChangedEvent',
        title: 'Campaign Status Changed',
        summary: 'Published when campaign status changes',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                oldStatus: { type: 'string' },
                newStatus: { type: 'string' },
                changedBy: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      DonationInitiatedEvent: {
        name: 'DonationInitiatedEvent',
        title: 'Donation Initiated',
        summary: 'Published when donation process starts',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                donationId: { type: 'string', format: 'uuid' },
                campaignId: { type: 'string', format: 'uuid' },
                donorId: { type: 'string', format: 'uuid' },
                amount: { type: 'number' },
                currency: { type: 'string' },
              },
            },
          },
        },
      },
      DonationCompletedEvent: {
        name: 'DonationCompletedEvent',
        title: 'Donation Completed',
        summary: 'Published when donation is successfully processed',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                donationId: { type: 'string', format: 'uuid' },
                transactionId: { type: 'string' },
                completedAt: { type: 'number' },
              },
            },
          },
        },
      },
      DonationFailedEvent: {
        name: 'DonationFailedEvent',
        title: 'Donation Failed',
        summary: 'Published when donation processing fails',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                donationId: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
                errorCode: { type: 'string' },
              },
            },
          },
        },
      },
      DonationRefundedEvent: {
        name: 'DonationRefundedEvent',
        title: 'Donation Refunded',
        summary: 'Published when donation is refunded',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                donationId: { type: 'string', format: 'uuid' },
                refundedBy: { type: 'string', format: 'uuid' },
                refundAmount: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      OrganizationCreatedEvent: {
        name: 'OrganizationCreatedEvent',
        title: 'Organization Created',
        summary: 'Published when new organization is created',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', format: 'uuid' },
                legalName: { type: 'string' },
                createdBy: { type: 'string', format: 'uuid' },
                verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
              },
            },
          },
        },
      },
      OrganizationVerifiedEvent: {
        name: 'OrganizationVerifiedEvent',
        title: 'Organization Verified',
        summary: 'Published when organization is verified',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', format: 'uuid' },
                verifiedBy: { type: 'string', format: 'uuid' },
                verifiedAt: { type: 'number' },
              },
            },
          },
        },
      },
      OrganizationRejectedEvent: {
        name: 'OrganizationRejectedEvent',
        title: 'Organization Rejected',
        summary: 'Published when organization verification is rejected',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', format: 'uuid' },
                rejectedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      OrganizationUpdatedEvent: {
        name: 'OrganizationUpdatedEvent',
        title: 'Organization Updated',
        summary: 'Published when organization info is updated',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
                changes: { type: 'object' },
              },
            },
          },
        },
      },
      OrganizationDeletedEvent: {
        name: 'OrganizationDeletedEvent',
        title: 'Organization Deleted',
        summary: 'Published when organization is deleted',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', format: 'uuid' },
                deletedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      UserSuspendedEvent: {
        name: 'UserSuspendedEvent',
        title: 'User Suspended',
        summary: 'Published when admin suspends a user',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                suspendedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
                duration: { type: 'number' },
              },
            },
          },
        },
      },
      UserDeletedEvent: {
        name: 'UserDeletedEvent',
        title: 'User Deleted',
        summary: 'Published when admin deletes a user',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                deletedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      UserRoleAssignedEvent: {
        name: 'UserRoleAssignedEvent',
        title: 'User Role Assigned',
        summary: 'Published when admin assigns role to user',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                assignedBy: { type: 'string', format: 'uuid' },
                oldRole: { type: 'string' },
                newRole: { type: 'string' },
              },
            },
          },
        },
      },
      CampaignApprovedEvent: {
        name: 'CampaignApprovedEvent',
        title: 'Campaign Approved',
        summary: 'Published when admin approves a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                approvedBy: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      CampaignRejectedEvent: {
        name: 'CampaignRejectedEvent',
        title: 'Campaign Rejected',
        summary: 'Published when admin rejects a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                rejectedBy: { type: 'string', format: 'uuid' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      CampaignFeaturedEvent: {
        name: 'CampaignFeaturedEvent',
        title: 'Campaign Featured',
        summary: 'Published when admin features a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                featuredBy: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      CampaignUnfeaturedEvent: {
        name: 'CampaignUnfeaturedEvent',
        title: 'Campaign Unfeatured',
        summary: 'Published when admin unfeatures a campaign',
        payload: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                campaignId: { type: 'string', format: 'uuid' },
                unfeaturedBy: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export type EventType = keyof typeof eventSpecification.channels;
