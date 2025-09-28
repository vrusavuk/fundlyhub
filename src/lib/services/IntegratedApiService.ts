/**
 * Integrated API Service - Combines all enterprise features
 */
import { supabase } from '@/integrations/supabase/client';
import { enhancedApiService } from './EnhancedApiService';
import { distributedCache } from '../cache/DistributedCache';
import { securityMiddleware } from '../security/SecurityMiddleware';
import { structuredLogger } from '../monitoring/StructuredLogger';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';
import { 
  validateFundraiser, 
  validateDonation, 
  validateProfile,
  validateComment,
  validateSearch,
  createValidationMiddleware
} from '../validation/EnhancedSchemas';

export interface QueryOptions {
  cacheKey?: string;
  cacheTTL?: number;
  skipCache?: boolean;
  skipValidation?: boolean;
  correlationId?: string;
}

class IntegratedApiService {
  /**
   * Enhanced fundraiser operations
   */
  async getFundraisers(params: any = {}, options: QueryOptions = {}) {
    const cacheKey = options.cacheKey || `fundraisers_${JSON.stringify(params)}`;
    const correlationId = options.correlationId || this.generateId();

    return distributedCache.getOrSet(
      cacheKey,
      async () => {
        const tracker = performanceMonitor.startRequest('get_fundraisers');
        
        try {
          // Validate search parameters
          if (!options.skipValidation) {
            params = validateSearch(params);
          }

          // Build query
          let query = supabase
            .from('fundraisers')
            .select(`
              *,
              categories(name, emoji, color_class),
              profiles(name, avatar),
              public_fundraiser_stats(total_raised, donor_count)
            `)
            .eq('visibility', 'public')
            .eq('status', 'active');

          // Apply filters
          if (params.category) {
            query = query.eq('category_id', params.category);
          }

          if (params.location) {
            query = query.ilike('location', `%${params.location}%`);
          }

          if (params.query) {
            query = query.or(`title.ilike.%${params.query}%,summary.ilike.%${params.query}%`);
          }

          // Apply sorting
          switch (params.sort) {
            case 'popular':
              query = query.order('total_raised', { ascending: false });
              break;
            case 'goal':
              query = query.order('goal_amount', { ascending: false });
              break;
            case 'recent':
            default:
              query = query.order('created_at', { ascending: false });
          }

          // Apply pagination
          if (params.limit) {
            query = query.limit(params.limit);
          }
          if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
          }

          const { data, error } = await query;

          if (error) throw error;

          await structuredLogger.info('Fundraisers retrieved', {
            correlationId,
            metadata: {
              count: data?.length || 0,
              params
            }
          });

          tracker.end({ success: true });
          return data;

        } catch (error) {
          tracker.end({ success: false });
          await structuredLogger.error('Failed to retrieve fundraisers', error as Error, {
            correlationId,
            metadata: { params }
          });
          throw error;
        }
      },
      options.cacheTTL || 300000, // 5 minutes default
      ['fundraisers', 'public_data']
    );
  }

  async createFundraiser(data: any, options: QueryOptions = {}) {
    const correlationId = options.correlationId || this.generateId();
    const tracker = performanceMonitor.startRequest('create_fundraiser');

    try {
      // Validate input
      if (!options.skipValidation) {
        data = validateFundraiser(data);
      }

      // Security check
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Authentication required');
      }

      // Log the operation
      await structuredLogger.audit(
        'fundraiser_create_attempt',
        'fundraiser',
        undefined,
        {
          correlationId,
          userId: user.user.id,
          metadata: { title: data.title }
        }
      );

      // Create fundraiser
      const { data: fundraiser, error } = await supabase
        .from('fundraisers')
        .insert({
          ...data,
          owner_user_id: user.user.id,
          slug: this.generateSlug(data.title),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate related caches
      await distributedCache.invalidateByTag('fundraisers');
      await distributedCache.invalidateByTag('user_data');

      // Log success
      await structuredLogger.audit(
        'fundraiser_created',
        'fundraiser',
        fundraiser.id,
        {
          correlationId,
          userId: user.user.id,
          metadata: { title: fundraiser.title }
        }
      );

      tracker.end({ success: true });
      return fundraiser;

    } catch (error) {
      tracker.end({ success: false });
      await structuredLogger.error('Failed to create fundraiser', error as Error, {
        correlationId,
        metadata: { title: data?.title }
      });
      throw error;
    }
  }

  async updateFundraiser(id: string, data: any, options: QueryOptions = {}) {
    const correlationId = options.correlationId || this.generateId();
    const tracker = performanceMonitor.startRequest('update_fundraiser');

    try {
      // Validate input
      if (!options.skipValidation) {
        data = validateFundraiser(data);
      }

      // Security check
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Authentication required');
      }

      // Check ownership
      const { data: existing } = await supabase
        .from('fundraisers')
        .select('owner_user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.owner_user_id !== user.user.id) {
        throw new Error('Unauthorized');
      }

      // Update fundraiser
      const { data: fundraiser, error } = await supabase
        .from('fundraisers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      await distributedCache.invalidateByPattern(`fundraiser_${id}*`);
      await distributedCache.invalidateByTag('fundraisers');

      // Log the update
      await structuredLogger.audit(
        'fundraiser_updated',
        'fundraiser',
        id,
        {
          correlationId,
          userId: user.user.id,
          metadata: { changes: Object.keys(data) }
        }
      );

      tracker.end({ success: true });
      return fundraiser;

    } catch (error) {
      tracker.end({ success: false });
      await structuredLogger.error('Failed to update fundraiser', error as Error, {
        correlationId,
        metadata: { fundraiserId: id }
      });
      throw error;
    }
  }

  /**
   * Enhanced donation operations
   */
  async createDonation(data: any, options: QueryOptions = {}) {
    const correlationId = options.correlationId || this.generateId();
    const tracker = performanceMonitor.startRequest('create_donation');

    try {
      // Validate input
      if (!options.skipValidation) {
        data = validateDonation(data);
      }

      // Verify fundraiser exists and is active
      const { data: fundraiser } = await supabase
        .from('fundraisers')
        .select('id, status, owner_user_id')
        .eq('id', data.fundraiser_id)
        .eq('status', 'active')
        .single();

      if (!fundraiser) {
        throw new Error('Fundraiser not found or not active');
      }

      // Get current user (if logged in)
      const { data: user } = await supabase.auth.getUser();

      // Create donation
      const { data: donation, error } = await supabase
        .from('donations')
        .insert({
          ...data,
          donor_user_id: user.user?.id || null,
          net_amount: data.amount - (data.tip_amount || 0),
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate fundraiser caches
      await distributedCache.invalidateByPattern(`fundraiser_${data.fundraiser_id}*`);
      await distributedCache.invalidateByTag('fundraiser_stats');

      // Log the donation
      await structuredLogger.audit(
        'donation_created',
        'donation',
        donation.id,
        {
          correlationId,
          userId: user.user?.id,
          metadata: { 
            amount: data.amount,
            fundraiserId: data.fundraiser_id,
            anonymous: data.is_anonymous
          }
        }
      );

      tracker.end({ success: true });
      return donation;

    } catch (error) {
      tracker.end({ success: false });
      await structuredLogger.error('Failed to create donation', error as Error, {
        correlationId,
        metadata: { fundraiserId: data?.fundraiser_id, amount: data?.amount }
      });
      throw error;
    }
  }

  /**
   * Enhanced profile operations
   */
  async getUserProfile(userId: string, options: QueryOptions = {}) {
    const cacheKey = options.cacheKey || `profile_${userId}`;
    const correlationId = options.correlationId || this.generateId();

    return distributedCache.getOrSet(
      cacheKey,
      async () => {
        const tracker = performanceMonitor.startRequest('get_user_profile');

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              *,
              subscriptions!follower_id(following_id, following_type)
            `)
            .eq('id', userId)
            .single();

          if (error) throw error;

          tracker.end({ success: true });
          return data;

        } catch (error) {
          tracker.end({ success: false });
          await structuredLogger.error('Failed to retrieve profile', error as Error, {
            correlationId,
            metadata: { userId }
          });
          throw error;
        }
      },
      options.cacheTTL || 600000, // 10 minutes
      ['profiles', 'user_data']
    );
  }

  /**
   * Health check for all integrated systems
   */
  async healthCheck() {
    const checks = {
      database: false,
      cache: false,
      security: false,
      performance: false
    };

    const issues: string[] = [];

    try {
      // Database health
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      checks.database = !dbError;
      if (dbError) issues.push('Database connection failed');

      // Cache health
      const cacheHealth = await distributedCache.healthCheck();
      checks.cache = cacheHealth.status !== 'unhealthy';
      if (cacheHealth.status === 'unhealthy') {
        issues.push(...cacheHealth.issues);
      }

      // Security monitoring
      const securityMetrics = securityMiddleware.getSecurityMetrics();
      checks.security = securityMetrics.blockedRequests < 10;
      if (securityMetrics.blockedRequests >= 10) {
        issues.push('High number of blocked requests');
      }

      // Performance monitoring
      const performanceHealth = await performanceMonitor.healthCheck();
      checks.performance = performanceHealth.status !== 'unhealthy';
      if (performanceHealth.status === 'unhealthy') {
        issues.push('Performance issues detected');
      }

    } catch (error) {
      issues.push(`Health check failed: ${(error as Error).message}`);
    }

    const allHealthy = Object.values(checks).every(check => check);
    const status = allHealthy ? 'healthy' : (issues.length > 2 ? 'unhealthy' : 'degraded');

    return {
      status,
      checks,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}

export const integratedApiService = new IntegratedApiService();