/**
 * Fundraiser Service - Thin wrapper around unified API
 * Domain-specific logic for fundraiser operations
 */
import { supabase } from '@/integrations/supabase/client';
import { unifiedApi } from './unified-api.service';
import type { Fundraiser } from '@/types';

export interface FundraiserQueryOptions {
  limit?: number;
  offset?: number;
  category?: string;
  searchTerm?: string;
  status?: 'active' | 'draft' | 'ended' | 'closed' | 'pending' | 'paused';
  visibility?: 'public' | 'unlisted' | 'private';
  isProject?: boolean;
  ownerId?: string;
  includeAllStatuses?: boolean;
}

export interface FundraiserStats {
  fundraiserId: string;
  totalRaised: number;
  donorCount: number;
  daysLeft: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

class FundraiserService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch fundraisers with advanced filtering and pagination
   */
  async getFundraisers(
    options: FundraiserQueryOptions = {}
  ): Promise<PaginatedResult<Fundraiser>> {
    const {
      limit = 12,
      offset = 0,
      category,
      searchTerm,
      status = 'active',
      visibility = 'public',
      isProject,
      ownerId,
      includeAllStatuses
    } = options;

    const cacheKey = `fundraisers:${JSON.stringify(options)}`;

    return unifiedApi.query(
      async () => {
        let query = supabase
          .from('fundraisers')
          .select('*', { count: 'exact' })
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Owner filtering
        if (ownerId) {
          query = query.eq('owner_user_id', ownerId);
        }

        // Status filtering (optional for owner views)
        if (!includeAllStatuses) {
          query = query.eq('status', status);
        }

        // Visibility filtering (optional for owner views)
        if (!ownerId || !includeAllStatuses) {
          query = query.eq('visibility', visibility);
        }

        if (category && category !== 'All') {
          query = query.eq('category_id', category);
        }

        if (searchTerm) {
          query = query.or(
            `title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`
          );
        }

        if (isProject !== undefined) {
          query = query.eq('is_project', isProject);
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) return { data: null, error };

        // Fetch owner profiles securely using RPC
        const fundraisers = data || [];
        if (fundraisers.length > 0) {
          const uniqueOwnerIds = [...new Set(fundraisers.map(f => f.owner_user_id))];
          
          const profilePromises = uniqueOwnerIds.map(async (ownerId) => {
            const { data: profileData } = await supabase
              .rpc('get_public_user_profile', { profile_id: ownerId });
            return { ownerId, profile: profileData?.[0] || null };
          });

          const profiles = await Promise.all(profilePromises);
          const profileMap = profiles.reduce((acc, { ownerId, profile }) => {
            acc[ownerId] = profile;
            return acc;
          }, {} as Record<string, any>);

          fundraisers.forEach((fundraiser: any) => {
            fundraiser.profiles = profileMap[fundraiser.owner_user_id] || null;
          });
        }

        return {
          data: {
            data: fundraisers as Fundraiser[],
            hasMore: (fundraisers?.length || 0) === limit,
            total: count || 0,
          },
          error: null
        };
      },
      { cache: { key: cacheKey, ttl: this.CACHE_TTL, tags: ['fundraisers'] } }
    );
  }

  /**
   * Fetch fundraiser statistics efficiently
   */
  async getFundraiserStats(fundraiserIds: string[]): Promise<Record<string, FundraiserStats>> {
    if (fundraiserIds.length === 0) return {};

    const cacheKey = `fundraiser-stats:${fundraiserIds.sort().join(',')}`;

    return unifiedApi.query(
      async () => {
        const { data: fundraisers, error: fundraiserError } = await supabase
          .from('fundraisers')
          .select('id, end_date')
          .in('id', fundraiserIds);

        if (fundraiserError) return { data: null, error: fundraiserError };

        const { data: statsData, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('fundraiser_id, donor_count, total_raised')
          .in('fundraiser_id', fundraiserIds);

        if (statsError) return { data: null, error: statsError };

        const statsMap: Record<string, FundraiserStats> = {};
        
        fundraisers?.forEach(fundraiser => {
          const stat = statsData?.find(s => s.fundraiser_id === fundraiser.id);
          
          let daysLeft: number | null = null;
          if (fundraiser.end_date) {
            const endDate = new Date(fundraiser.end_date);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }

          statsMap[fundraiser.id] = {
            fundraiserId: fundraiser.id,
            totalRaised: Number(stat?.total_raised) || 0,
            donorCount: Number(stat?.donor_count) || 0,
            daysLeft,
          };
        });

        return { data: statsMap, error: null };
      },
      { cache: { key: cacheKey, ttl: this.CACHE_TTL / 2, tags: ['fundraiser-stats'] } }
    );
  }

  /**
   * Fetch single fundraiser by slug
   */
  async getFundraiserBySlug(slug: string): Promise<Fundraiser | null> {
    const cacheKey = `fundraiser:${slug}`;

    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase
          .from('fundraisers')
          .select('*')
          .eq('slug', slug)
          .eq('visibility', 'public')
          .maybeSingle();

        if (error) return { data: null, error };

        if (data && data.owner_user_id) {
          const { data: profileData } = await supabase
            .rpc('get_public_user_profile', { profile_id: data.owner_user_id });
          
          if (profileData && profileData.length > 0) {
            (data as any).profiles = {
              name: profileData[0].name,
              avatar: profileData[0].avatar,
            };
          }
        }
        
        return { data: data as Fundraiser, error: null };
      },
      { cache: { key: cacheKey, ttl: this.CACHE_TTL, tags: ['fundraisers'] } }
    );
  }

  /**
   * Get campaigns for a specific user profile
   */
  async getUserCampaigns(
    userId: string, 
    options: {
      statuses?: ('active' | 'draft' | 'ended' | 'closed' | 'pending' | 'paused')[];
      includePrivate?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResult<Fundraiser>> {
    const {
      statuses = ['draft', 'active', 'paused'],
      includePrivate = false,
      limit = 50,
      offset = 0
    } = options;

    const cacheKey = `user-campaigns:${userId}:${JSON.stringify(options)}`;

    return unifiedApi.query(
      async () => {
        let query = supabase
          .from('fundraisers')
          .select('*', { count: 'exact' })
          .eq('owner_user_id', userId)
          .in('status', statuses)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Filter by visibility if not including private campaigns
        if (!includePrivate) {
          query = query.eq('visibility', 'public');
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) return { data: null, error };

        // Fetch owner profiles securely using RPC
        const fundraisers = data || [];
        if (fundraisers.length > 0) {
          const { data: profileData } = await supabase
            .rpc('get_public_user_profile', { profile_id: userId });
          
          const profile = profileData?.[0] || null;

          fundraisers.forEach((fundraiser: any) => {
            fundraiser.profiles = profile;
          });
        }

        return {
          data: {
            data: fundraisers as Fundraiser[],
            hasMore: (fundraisers?.length || 0) === limit,
            total: count || 0,
          },
          error: null
        };
      },
      { 
        cache: { 
          key: cacheKey, 
          ttl: this.CACHE_TTL, 
          tags: ['fundraisers', `user-campaigns:${userId}`] 
        } 
      }
    );
  }

  /**
   * Clear fundraiser-related cache
   */
  clearCache(pattern?: string): void {
    unifiedApi.clearCache(pattern || 'fundraiser*');
  }
}

export const fundraiserService = new FundraiserService();
