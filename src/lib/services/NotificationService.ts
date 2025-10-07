import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import { DomainEvent } from '@/lib/events/types';

interface NotificationTemplate {
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  icon: string;
  actionUrl?: string;
  actionLabel?: string;
  recipientStrategy: 'user' | 'role' | 'global' | 'custom';
  getRecipients?: (event: DomainEvent) => Promise<string[]>;
}

class NotificationService {
  private templates: Record<string, NotificationTemplate> = {
    'campaign.created': {
      type: 'campaign',
      category: 'transactional',
      priority: 'medium',
      title: 'Campaign Created',
      message: 'Your campaign "{title}" has been created successfully',
      icon: 'Rocket',
      actionUrl: '/fundraisers/{campaignId}',
      actionLabel: 'View Campaign',
      recipientStrategy: 'user'
    },
    'campaign.updated': {
      type: 'campaign',
      category: 'transactional',
      priority: 'low',
      title: 'Campaign Updated',
      message: 'Campaign "{title}" has been updated',
      icon: 'Edit',
      actionUrl: '/fundraisers/{campaignId}',
      actionLabel: 'View Changes',
      recipientStrategy: 'user'
    },
    'campaign.status_changed': {
      type: 'campaign',
      category: 'transactional',
      priority: 'high',
      title: 'Campaign Status Changed',
      message: 'Your campaign is now {status}',
      icon: 'Bell',
      actionUrl: '/fundraisers/{campaignId}',
      actionLabel: 'View Campaign',
      recipientStrategy: 'user'
    },
    'donation.completed': {
      type: 'donation',
      category: 'transactional',
      priority: 'high',
      title: 'New Donation Received',
      message: 'You received a donation of ${amount}',
      icon: 'DollarSign',
      actionUrl: '/fundraisers/{campaignId}',
      actionLabel: 'View Donations',
      recipientStrategy: 'custom',
      getRecipients: async (event) => {
        const { data } = await supabase
          .from('fundraisers')
          .select('owner_user_id')
          .eq('id', event.payload.campaignId)
          .single();
        return data ? [data.owner_user_id] : [];
      }
    },
    'admin.campaign.approved': {
      type: 'admin',
      category: 'transactional',
      priority: 'high',
      title: 'Campaign Approved',
      message: 'Your campaign has been approved and is now live',
      icon: 'CheckCircle',
      actionUrl: '/fundraisers/{campaignId}',
      actionLabel: 'View Campaign',
      recipientStrategy: 'user'
    },
    'admin.campaign.rejected': {
      type: 'admin',
      category: 'transactional',
      priority: 'high',
      title: 'Campaign Requires Changes',
      message: 'Your campaign needs revisions: {reason}',
      icon: 'AlertCircle',
      actionUrl: '/create',
      actionLabel: 'Edit Campaign',
      recipientStrategy: 'user'
    },
    'admin.user.suspended': {
      type: 'security',
      category: 'security',
      priority: 'urgent',
      title: 'Account Suspended',
      message: 'Your account has been suspended. Reason: {reason}',
      icon: 'ShieldAlert',
      actionUrl: '/',
      actionLabel: 'Learn More',
      recipientStrategy: 'user'
    },
    'user.followed': {
      type: 'social',
      category: 'social',
      priority: 'low',
      title: 'New Follower',
      message: '{followerName} started following you',
      icon: 'UserPlus',
      actionUrl: '/profile/{followerId}',
      actionLabel: 'View Profile',
      recipientStrategy: 'user'
    },
    'organization.followed': {
      type: 'social',
      category: 'social',
      priority: 'low',
      title: 'New Follower',
      message: '{followerName} started following your organization',
      icon: 'Users',
      actionUrl: '/organizations/{organizationId}',
      actionLabel: 'View Organization',
      recipientStrategy: 'custom',
      getRecipients: async (event) => {
        const { data } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', event.payload.organizationId)
          .in('role', ['owner', 'admin']);
        return data ? data.map(m => m.user_id) : [];
      }
    }
  };

  async initialize() {
    console.log('[NotificationService] Initializing...');
    
    Object.keys(this.templates).forEach(eventType => {
      globalEventBus.subscribe(eventType, {
        eventType,
        handle: async (event: DomainEvent) => {
          await this.createNotification(event);
        }
      });
    });

    console.log('[NotificationService] Subscribed to', Object.keys(this.templates).length, 'event types');
  }

  private async createNotification(event: DomainEvent) {
    const template = this.templates[event.type];
    if (!template) return;

    try {
      const recipients = await this.getRecipients(event, template);
      if (recipients.length === 0) {
        console.log('[NotificationService] No recipients for event:', event.type);
        return;
      }

      const notification = {
        type: template.type,
        category: template.category,
        priority: template.priority,
        title: this.interpolate(template.title, event),
        message: this.interpolate(template.message, event),
        icon: template.icon,
        action_url: template.actionUrl ? this.interpolate(template.actionUrl, event) : null,
        action_label: template.actionLabel,
        event_id: event.id,
        correlation_id: event.correlationId,
        related_resource_type: this.getResourceType(event),
        related_resource_id: this.getResourceId(event),
        created_at: new Date(event.timestamp).toISOString()
      };

      for (const recipientId of recipients) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            ...notification,
            user_id: recipientId
          });

        if (error) {
          console.error('[NotificationService] Failed to insert notification:', error);
        }
      }

      console.log(`[NotificationService] Created ${recipients.length} notifications for ${event.type}`);
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
    }
  }

  private async getRecipients(event: DomainEvent, template: NotificationTemplate): Promise<string[]> {
    if (template.getRecipients) {
      return await template.getRecipients(event);
    }

    const { payload } = event;

    switch (template.recipientStrategy) {
      case 'user':
        return [payload.userId || payload.ownerId || payload.followedUserId].filter(Boolean);
      case 'global':
        return [];
      case 'role':
        return [];
      default:
        return [];
    }
  }

  private interpolate(template: string, event: DomainEvent): string {
    let result = template;
    const matches = template.match(/\{(\w+)\}/g);
    
    if (matches) {
      matches.forEach(match => {
        const key = match.slice(1, -1);
        const value = event.payload[key] || event.metadata?.[key] || match;
        result = result.replace(match, String(value));
      });
    }
    
    return result;
  }

  private getResourceType(event: DomainEvent): string | null {
    if (event.type.includes('campaign')) return 'campaign';
    if (event.type.includes('donation')) return 'donation';
    if (event.type.includes('user')) return 'user';
    if (event.type.includes('organization')) return 'organization';
    return null;
  }

  private getResourceId(event: DomainEvent): string | null {
    return event.payload.campaignId || 
           event.payload.donationId || 
           event.payload.userId || 
           event.payload.organizationId || 
           null;
  }
}

export const notificationService = new NotificationService();
