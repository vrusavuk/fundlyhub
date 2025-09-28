/**
 * Analytics Event Subscriber
 * Following Single Responsibility Principle
 */

import { EventHandler, EventSubscriber } from '../types';
import { UserEvent } from '../domain/UserEvents';
import { CampaignEvent } from '../domain/CampaignEvents';
import { DonationEvent } from '../domain/DonationEvents';

interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

interface AnalyticsService {
  track(metric: AnalyticsMetric): Promise<void>;
  increment(name: string, tags?: Record<string, string>): Promise<void>;
  gauge(name: string, value: number, tags?: Record<string, string>): Promise<void>;
}

export class AnalyticsSubscriber {
  private handlers: EventHandler[] = [];

  constructor(
    private analyticsService: AnalyticsService,
    private eventSubscriber: EventSubscriber
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // User analytics handlers
    this.registerHandler('user.registered', async (event: UserEvent) => {
      if (event.type === 'user.registered') {
        await this.analyticsService.increment('user.registrations', {
          method: event.payload.registrationMethod || 'unknown',
          role: event.payload.role || 'visitor',
        });
      }
    });

    this.registerHandler('user.logged_in', async (event: UserEvent) => {
      if (event.type === 'user.logged_in') {
        await this.analyticsService.increment('user.logins', {
          userId: event.payload.userId,
        });
      }
    });

    this.registerHandler('user.followed_campaign', async (event: UserEvent) => {
      if (event.type === 'user.followed_campaign') {
        await this.analyticsService.increment('user.follows', {
          followType: event.payload.followType,
        });
      }
    });

    // Campaign analytics handlers
    this.registerHandler('campaign.created', async (event: CampaignEvent) => {
      if (event.type === 'campaign.created') {
        await this.analyticsService.increment('campaigns.created', {
          categoryId: event.payload.categoryId,
          visibility: event.payload.visibility,
        });

        await this.analyticsService.gauge('campaigns.goal_amount', event.payload.goalAmount, {
          categoryId: event.payload.categoryId,
        });
      }
    });

    this.registerHandler('campaign.goal_reached', async (event: CampaignEvent) => {
      if (event.type === 'campaign.goal_reached') {
        await this.analyticsService.increment('campaigns.goals_reached');
        
        await this.analyticsService.track({
          name: 'campaign.success',
          value: event.payload.totalRaised,
          timestamp: event.timestamp,
          tags: {
            campaignId: event.payload.campaignId,
            donorCount: event.payload.donorCount.toString(),
          },
          metadata: {
            goalAmount: event.payload.goalAmount,
            overGoalAmount: event.payload.totalRaised - event.payload.goalAmount,
          },
        });
      }
    });

    // Donation analytics handlers
    this.registerHandler('donation.completed', async (event: DonationEvent) => {
      if (event.type === 'donation.completed') {
        await this.analyticsService.increment('donations.completed', {
          currency: event.payload.currency,
          paymentProvider: event.payload.paymentProvider,
        });

        await this.analyticsService.gauge('donations.amount', event.payload.amount, {
          currency: event.payload.currency,
          campaignId: event.payload.campaignId,
        });

        await this.analyticsService.track({
          name: 'donation.value',
          value: event.payload.netAmount,
          timestamp: event.timestamp,
          tags: {
            campaignId: event.payload.campaignId,
            currency: event.payload.currency,
          },
          metadata: {
            grossAmount: event.payload.amount,
            processingFee: event.payload.processingFee,
          },
        });
      }
    });

    this.registerHandler('donation.failed', async (event: DonationEvent) => {
      if (event.type === 'donation.failed') {
        await this.analyticsService.increment('donations.failed', {
          reason: event.payload.reason,
          retryable: event.payload.retryable.toString(),
        });
      }
    });
  }

  private registerHandler(
    eventType: string,
    handler: (event: UserEvent | CampaignEvent | DonationEvent) => Promise<void>
  ): void {
    const eventHandler: EventHandler = {
      eventType,
      handle: handler,
    };

    this.handlers.push(eventHandler);
    this.eventSubscriber.subscribe(eventType, eventHandler);
  }

  public unsubscribeAll(): void {
    this.handlers.forEach(handler => {
      this.eventSubscriber.unsubscribe(handler.eventType, handler);
    });
    this.handlers = [];
  }
}