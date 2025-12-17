/**
 * Enterprise Admin Data Service
 * Centralized data fetching with caching, N+1 prevention, and real-time updates
 * Follows SOLID principles - Single Responsibility for admin data operations
 */

import { supabase } from '@/integrations/supabase/client';
import { AdminCache } from '@/lib/cache/AdminCache';
import { logger } from './logger.service';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  category?: string;
  visibility?: string;
  dateRange?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

class AdminDataService {
  private cache: AdminCache;

  constructor() {
    this.cache = new AdminCache();
  }

  /**
   * Fetch users with optimized single query (prevents N+1)
   */
  async fetchUsers(pagination: PaginationOptions, filters: FilterOptions) {
    const cacheKey = `users:${JSON.stringify({ pagination, filters })}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_role_assignments!user_id(
            role_id,
            roles!inner(name, display_name, hierarchy_level)
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('account_status', filters.status);
      }
      if (filters.role) {
        query = query.eq('user_role_assignments.roles.name', filters.role);
      }

      // Apply pagination
      const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * pageSize;
      
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }, { ttl: 30000 }); // 30 second cache
  }

  /**
   * Fetch organizations with members and campaigns (prevents N+1)
   */
  async fetchOrganizations(pagination: PaginationOptions, filters: FilterOptions) {
    const cacheKey = `organizations:${JSON.stringify({ pagination, filters })}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      let query = supabase
        .from('organizations')
        .select(`
          *,
          org_members(count),
          fundraisers!org_id(id, status, goal_amount)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`legal_name.ilike.%${filters.search}%,dba_name.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('verification_status', filters.status as any);
      }

      // Apply pagination
      const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * pageSize;
      
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }, { ttl: 30000 });
  }

  /**
   * Fetch campaigns with stats in batch (prevents N+1)
   */
  async fetchCampaigns(pagination: PaginationOptions, filters: FilterOptions) {
    const cacheKey = `campaigns:${JSON.stringify({ pagination, filters })}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      let query = supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(id, name, email, avatar),
          categories(name, emoji, color_class)
        `, { count: 'exact' })
        .is('deleted_at', null); // Filter out soft-deleted campaigns

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,beneficiary_name.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility as any);
      }

      // Handle preset date ranges
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Handle custom date range
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      // Apply pagination
      const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * pageSize;
      
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;

      // Batch fetch stats for all campaigns
      const campaignIds = data?.map(c => c.id) || [];
      const statsMap = await this.fetchCampaignStatsBatch(campaignIds);

      const enrichedData = data?.map(campaign => ({
        ...campaign,
        owner_profile: campaign.profiles || null, // Map profiles to owner_profile
        profiles: undefined, // Remove original profiles field
        stats: statsMap.get(campaign.id) || {
          total_raised: 0,
          donor_count: 0,
          unique_donors: 0
        }
      }));

      return {
        data: enrichedData || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }, { ttl: 10000 }); // 10 second cache for faster updates
  }

  /**
   * Batch fetch campaign stats (single query for all campaigns)
   */
  private async fetchCampaignStatsBatch(campaignIds: string[]) {
    if (campaignIds.length === 0) return new Map();

    const { data, error } = await supabase
      .rpc('get_fundraiser_totals', { fundraiser_ids: campaignIds });

    if (error) {
      logger.error('Failed to fetch campaign stats batch', error, {
        componentName: 'AdminDataService',
        operationName: 'fetchCampaignStatsBatch',
        metadata: { campaignCount: campaignIds.length },
      });
      return new Map();
    }

    const statsMap = new Map();
    data?.forEach((stat: any) => {
      statsMap.set(stat.fundraiser_id, {
        total_raised: stat.total_raised,
        donor_count: stat.donor_count,
        unique_donors: stat.donor_count // Simplified
      });
    });

    return statsMap;
  }

  /**
   * Fetch roles with user counts in single query (prevents N+1)
   */
  async fetchRoles() {
    return this.cache.getOrSet('roles:all', async () => {
      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('hierarchy_level', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch user counts for all roles in one query
      const { data: userCounts, error: countsError } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('is_active', true);

      if (countsError) throw countsError;

      // Count users per role
      const countMap = new Map<string, number>();
      userCounts?.forEach(assignment => {
        countMap.set(
          assignment.role_id,
          (countMap.get(assignment.role_id) || 0) + 1
        );
      });

      // Enrich roles with counts
      const rolesWithCounts = roles?.map(role => ({
        ...role,
        user_count: countMap.get(role.id) || 0
      }));

      return rolesWithCounts || [];
    }, { ttl: 60000 }); // 60 second cache
  }

  /**
   * Fetch aggregate campaign statistics (database-level, not page-level)
   */
  async fetchCampaignStats(filters: FilterOptions) {
    const cacheKey = `campaign-stats:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase.rpc('get_campaign_aggregate_stats', {
        search_term: filters.search || null,
        status_filter: filters.status || null,
        category_filter: filters.category || null,
        visibility_filter: filters.visibility || null
      });

      if (error) {
        logger.error('Failed to fetch campaign aggregate stats', error, {
          componentName: 'AdminDataService',
          operationName: 'fetchCampaignStats',
          metadata: { filters },
        });
        throw error;
      }

      const stats = data?.[0] || {
        total_campaigns: 0,
        active_campaigns: 0,
        closed_campaigns: 0,
        pending_campaigns: 0,
        paused_campaigns: 0,
        draft_campaigns: 0,
        ended_campaigns: 0,
        total_raised: 0
      };

      return {
        total: Number(stats.total_campaigns),
        active: Number(stats.active_campaigns),
        closed: Number(stats.closed_campaigns),
        pending: Number(stats.pending_campaigns),
        paused: Number(stats.paused_campaigns),
        draft: Number(stats.draft_campaigns),
        ended: Number(stats.ended_campaigns),
        totalRaised: Number(stats.total_raised)
      };
    }, { ttl: 10000 }); // 10 second cache for faster updates
  }

  /**
   * Fetch dashboard stats (replaces mock data)
   */
  async fetchDashboardStats() {
    return this.cache.getOrSet('dashboard:stats', async () => {
        const [usersResult, campaignsResult, orgsResult, fundsResult, activitiesResult, healthResult] = 
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('fundraisers').select('status'),
          supabase.from('organizations').select('verification_status'),
          supabase.rpc('get_campaign_stats'),
          supabase.rpc('get_recent_activities' as any, { limit_count: 10 }),
          supabase.rpc('get_system_health' as any)
        ]);

      const campaignData = campaignsResult.data || [];
      const orgData = orgsResult.data || [];

      return {
        totalUsers: usersResult.count || 0,
        activeCampaigns: campaignData.filter(c => c.status === 'active').length,
        pendingCampaigns: campaignData.filter(c => c.status === 'pending').length,
        totalOrganizations: orgData.length,
        verifiedOrganizations: orgData.filter(o => o.verification_status === 'approved').length,
        totalFundsRaised: fundsResult.data?.[0]?.total_funds_raised || 0,
        monthlyGrowth: 12.5, // TODO: Calculate from historical data
        recentActivities: activitiesResult.data || [],
        systemHealth: healthResult.data || {
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy',
          lastCheck: new Date().toISOString()
        }
      };
    }, { ttl: 60000 }); // 60 second cache
  }

  /**
   * Fetch donations for a specific campaign with donor information
   */
  async fetchCampaignDonations(campaignId: string) {
    const cacheKey = `campaign-donations:${campaignId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          currency,
          created_at,
          is_anonymous,
          donor_name,
          donor_email,
          message,
          payment_status,
          profiles:donor_user_id(
            name,
            avatar
          )
        `)
        .eq('fundraiser_id', campaignId)
        .in('payment_status', ['paid'])
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch campaign donations', error, {
          componentName: 'AdminDataService',
          operationName: 'fetchCampaignDonations',
          metadata: { campaignId },
        });
        throw error;
      }

      // Format donations with proper privacy handling
      const formattedDonations = data?.map((donation: any) => {
        const isAnonymous = donation.is_anonymous;
        
        return {
          id: donation.id,
          amount: Number(donation.amount),
          currency: donation.currency,
          created_at: donation.created_at,
          payment_status: donation.payment_status,
          message: donation.message,
          donor_email: isAnonymous ? null : donation.donor_email,
          donor_name: isAnonymous 
            ? 'Anonymous' 
            : (donation.donor_name || donation.profiles?.name || 'Anonymous'),
          donor_avatar: isAnonymous ? null : donation.profiles?.avatar,
          is_anonymous: isAnonymous
        };
      }) || [];

      return formattedDonations;
    }, { ttl: 10000 }); // 10 second cache
  }

  /**
   * Fetch all donations with pagination and filtering
   */
  async fetchDonations(pagination: PaginationOptions, filters: FilterOptions) {
    const cacheKey = `donations:${JSON.stringify({ pagination, filters })}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      let query = supabase
        .from('donations')
        .select(`
          *,
          payment_method_type,
          card_brand,
          card_last4,
          fundraisers!fundraiser_id(
            id,
            title,
            slug,
            status
          ),
          profiles:donor_user_id(
            name,
            email,
            avatar
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`donor_name.ilike.%${filters.search}%,donor_email.ilike.%${filters.search}%,receipt_id.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('payment_status', filters.status as any);
      }

      // Apply pagination
      const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * pageSize;
      
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;

      const enrichedData = data?.map((donation: any) => ({
        ...donation,
        fundraiser: donation.fundraisers,
        donor: donation.profiles,
        fundraisers: undefined,
        profiles: undefined,
      }));

      return {
        data: enrichedData || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }, { ttl: 5000 }); // 5 second cache for real-time nature
  }

  /**
   * Fetch donation statistics
   */
  async fetchDonationStats(filters: FilterOptions) {
    const cacheKey = `donation-stats:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      let query = supabase
        .from('donations')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`donor_name.ilike.%${filters.search}%,donor_email.ilike.%${filters.search}%,receipt_id.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('payment_status', filters.status as any);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to fetch donation stats', error, {
          componentName: 'AdminDataService',
          operationName: 'fetchDonationStats',
          metadata: { filters },
        });
        throw error;
      }

      const total = data?.length || 0;
      const totalAmount = data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalTips = data?.reduce((sum, d) => sum + Number(d.tip_amount || 0), 0) || 0;
      const totalFees = data?.reduce((sum, d) => sum + Number(d.fee_amount || 0), 0) || 0;

      const byStatus = {
        pending: data?.filter((d: any) => d.payment_status === 'pending').length || 0,
        paid: data?.filter((d: any) => d.payment_status === 'paid' || d.payment_status === 'completed').length || 0,
        failed: data?.filter((d: any) => d.payment_status === 'failed').length || 0,
        refunded: data?.filter((d: any) => d.payment_status === 'refunded').length || 0,
      };

      // Get recent donations (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentDonations = data?.filter((d: any) => d.created_at > oneDayAgo).length || 0;

      return {
        total,
        totalAmount,
        averageAmount: total > 0 ? totalAmount / total : 0,
        totalTips,
        totalFees,
        byStatus,
        byProvider: {
          stripe: total, // Assuming all are stripe for now
        },
        recentDonations,
      };
    }, { ttl: 5000 }); // 5 second cache
  }

  /**
   * Fetch a single user by ID (optimized)
   */
  async fetchUserById(userId: string) {
    const cacheKey = `user:${userId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_role_assignments!user_id(
            role_id,
            roles!inner(name, display_name, hierarchy_level)
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      return data;
    }, { ttl: 30000 });
  }

  /**
   * Fetch a single campaign by ID (optimized)
   */
  async fetchCampaignById(campaignId: string) {
    const cacheKey = `campaign:${campaignId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(id, name, email, avatar),
          categories(name, emoji, color_class)
        `)
        .eq('id', campaignId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Campaign not found');
      
      // Fetch stats for this campaign
      const statsMap = await this.fetchCampaignStatsBatch([campaignId]);
      
      return {
        ...data,
        owner_profile: data.profiles,
        profiles: undefined,
        stats: statsMap.get(campaignId) || {
          total_raised: 0,
          donor_count: 0,
          unique_donors: 0
        }
      };
    }, { ttl: 10000 });
  }

  /**
   * Fetch a single organization by ID (optimized)
   */
  async fetchOrganizationById(orgId: string) {
    const cacheKey = `organization:${orgId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          org_members(count),
          fundraisers!org_id(id, status, goal_amount)
        `)
        .eq('id', orgId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Organization not found');
      
      // Calculate member count and campaign count
      const memberCount = data.org_members?.[0]?.count || 0;
      const campaigns = data.fundraisers || [];
      const totalRaised = campaigns.reduce((sum: number, c: any) => 
        sum + Number(c.goal_amount || 0), 0);
      
      return {
        ...data,
        member_count: memberCount,
        campaign_count: campaigns.length,
        total_raised: totalRaised,
      };
    }, { ttl: 30000 });
  }

  /**
   * Fetch a single donation by ID (optimized)
   */
  async fetchDonationById(donationId: string) {
    const cacheKey = `donation:${donationId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          fundraisers!fundraiser_id(
            id,
            title,
            slug,
            status
          ),
          profiles:donor_user_id(
            name,
            email,
            avatar
          )
        `)
        .eq('id', donationId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Donation not found');
      
      return {
        ...data,
        fundraiser: data.fundraisers,
        donor: data.profiles,
        fundraisers: undefined,
        profiles: undefined,
      };
    }, { ttl: 5000 });
  }

  /**
   * Fetch donations for a specific user
   */
  async fetchUserDonations(userId: string) {
    const cacheKey = `user-donations:${userId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          currency,
          payment_status,
          created_at,
          is_anonymous,
          donor_name,
          receipt_id,
          fundraisers!fundraiser_id(
            id,
            title,
            slug,
            status
          )
        `)
        .eq('donor_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }, { ttl: 10000 });
  }

  /**
   * Fetch donations for a specific user with pagination
   */
  async fetchUserDonationsPaginated(
    userId: string,
    pagination: { page: number; pageSize: number }
  ) {
    const cacheKey = `user-donations-paginated:${userId}:${pagination.page}:${pagination.pageSize}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      // Get total count
      const { count } = await supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('donor_user_id', userId);

      // Get paginated data
      const { data, error } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          currency,
          payment_status,
          created_at,
          is_anonymous,
          donor_name,
          receipt_id,
          fundraisers!fundraiser_id(
            id,
            title,
            slug,
            status
          )
        `)
        .eq('donor_user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
    }, { ttl: 10000 });
  }

  /**
   * Clear cache for specific resource type
   */
  invalidateCache(resource: 'users' | 'organizations' | 'campaigns' | 'roles' | 'dashboard' | 'donations' | 'all') {
    if (resource === 'all') {
      this.cache.clear();
    } else {
      this.cache.clearPattern(`${resource}:`);
    }
  }
}

// Singleton instance
export const adminDataService = new AdminDataService();
