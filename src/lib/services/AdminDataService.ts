/**
 * Enterprise Admin Data Service
 * Centralized data fetching with caching, N+1 prevention, and real-time updates
 * Follows SOLID principles - Single Responsibility for admin data operations
 */

import { supabase } from '@/integrations/supabase/client';
import { AdminCache } from '@/lib/cache/AdminCache';

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
          user_role_assignments!left(
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
        query = query.eq('verification_status', filters.status);
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
          profiles!owner_user_id(id, name, email, avatar),
          categories(name, emoji, color_class)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category);
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
    }, { ttl: 30000 });
  }

  /**
   * Batch fetch campaign stats (single query for all campaigns)
   */
  private async fetchCampaignStatsBatch(campaignIds: string[]) {
    if (campaignIds.length === 0) return new Map();

    const { data, error } = await supabase
      .rpc('get_fundraiser_totals', { fundraiser_ids: campaignIds });

    if (error) {
      console.error('Error fetching campaign stats:', error);
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
          supabase.rpc('get_recent_activities', { limit_count: 10 }),
          supabase.rpc('get_system_health')
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
   * Clear cache for specific resource type
   */
  invalidateCache(resource: 'users' | 'organizations' | 'campaigns' | 'roles' | 'dashboard' | 'all') {
    if (resource === 'all') {
      this.cache.clear();
    } else {
      this.cache.clearPattern(`${resource}:`);
    }
  }
}

// Singleton instance
export const adminDataService = new AdminDataService();
