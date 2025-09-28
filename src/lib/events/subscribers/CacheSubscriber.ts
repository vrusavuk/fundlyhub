/**
 * Cache Management Event Subscriber
 * Following Single Responsibility Principle
 */

import { EventHandler, EventSubscriber } from '../types';
import { UserEvent } from '../domain/UserEvents';
import { CampaignEvent } from '../domain/CampaignEvents';
import { DonationEvent } from '../domain/DonationEvents';

interface CacheService {
  invalidate(pattern: string): Promise<void>;
  invalidateKeys(keys: string[]): Promise<void>;
  warm(key: string, data: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class CacheSubscriber {
  private handlers: EventHandler[] = [];

  constructor(
    private cacheService: CacheService,
    private eventSubscriber: EventSubscriber
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // User cache invalidation
    this.registerHandler('user.profile_updated', async (event: UserEvent) => {
      if (event.type === 'user.profile_updated') {
        const patterns = [
          `user:${event.payload.userId}:*`,
          `profile:${event.payload.userId}`,
          'users:list:*',
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    this.registerHandler('user.followed_campaign', async (event: UserEvent) => {
      if (event.type === 'user.followed_campaign') {
        await this.cacheService.invalidate(`user:${event.payload.userId}:following:*`);
        await this.cacheService.invalidate(`campaign:${event.payload.campaignId}:followers:*`);
      }
    });

    this.registerHandler('user.unfollowed_campaign', async (event: UserEvent) => {
      if (event.type === 'user.unfollowed_campaign') {
        await this.cacheService.invalidate(`user:${event.payload.userId}:following:*`);
        await this.cacheService.invalidate(`campaign:${event.payload.campaignId}:followers:*`);
      }
    });

    // Campaign cache invalidation
    this.registerHandler('campaign.created', async (event: CampaignEvent) => {
      if (event.type === 'campaign.created') {
        const patterns = [
          'campaigns:list:*',
          `campaigns:category:${event.payload.categoryId}:*`,
          `user:${event.payload.userId}:campaigns:*`,
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    this.registerHandler('campaign.updated', async (event: CampaignEvent) => {
      if (event.type === 'campaign.updated') {
        const patterns = [
          `campaign:${event.payload.campaignId}:*`,
          'campaigns:list:*',
          `user:${event.payload.userId}:campaigns:*`,
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    this.registerHandler('campaign.deleted', async (event: CampaignEvent) => {
      if (event.type === 'campaign.deleted') {
        const patterns = [
          `campaign:${event.payload.campaignId}:*`,
          'campaigns:list:*',
          `user:${event.payload.userId}:campaigns:*`,
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    this.registerHandler('campaign.goal_reached', async (event: CampaignEvent) => {
      if (event.type === 'campaign.goal_reached') {
        const patterns = [
          `campaign:${event.payload.campaignId}:*`,
          'campaigns:featured:*',
          'campaigns:successful:*',
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    // Donation cache invalidation
    this.registerHandler('donation.completed', async (event: DonationEvent) => {
      if (event.type === 'donation.completed') {
        const patterns = [
          `campaign:${event.payload.campaignId}:*`,
          `donations:campaign:${event.payload.campaignId}:*`,
          'campaigns:list:*', // May affect sorting by total raised
        ];

        if (event.payload.donorId) {
          patterns.push(`user:${event.payload.donorId}:donations:*`);
        }
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
      }
    });

    this.registerHandler('donation.refunded', async (event: DonationEvent) => {
      if (event.type === 'donation.refunded') {
        const patterns = [
          `donation:${event.payload.donationId}:*`,
          'donations:recent:*',
        ];
        
        await Promise.all(patterns.map(pattern => 
          this.cacheService.invalidate(pattern)
        ));
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