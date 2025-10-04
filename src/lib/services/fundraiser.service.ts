/**
 * Enterprise fundraiser service with proper data management
 */
import { supabase } from '@/integrations/supabase/client';
import { apiService, ApiError } from './api.service';
import type { Fundraiser } from '@/types';

export interface FundraiserQueryOptions {
  limit?: number;
  offset?: number;
  category?: string;
  searchTerm?: string;
  status?: 'active' | 'draft' | 'ended' | 'closed' | 'pending';
  visibility?: 'public' | 'unlisted';
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
      visibility = 'public'
    } = options;

    const cacheKey = `fundraisers:${JSON.stringify(options)}`;

    return apiService.executeWithCache(
      async () => {
        let query = supabase
          .from('fundraisers')
          .select('*', { count: 'exact' })
          .eq('status', status)
          .eq('visibility', visibility)
          .order('created_at', { ascending: false });

        if (category && category !== 'All') {
          query = query.eq('category_id', category);
        }

        if (searchTerm) {
          query = query.or(
            `title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`
          );
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) {
          throw new ApiError(
            `Failed to fetch fundraisers: ${error.message}`,
            error.code,
            undefined,
            true
          );
        }

        // Fetch owner profiles securely using RPC
        const fundraisers = data || [];
        if (fundraisers.length > 0) {
          const uniqueOwnerIds = [...new Set(fundraisers.map(f => f.owner_user_id))];
          
          // Fetch all owner profiles in parallel
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

          // Attach profiles to fundraisers
          fundraisers.forEach((fundraiser: any) => {
            fundraiser.profiles = profileMap[fundraiser.owner_user_id] || null;
          });
        }

        return {
          data: fundraisers,
          hasMore: (fundraisers?.length || 0) === limit,
          total: count || 0,
        };
      },
      { key: cacheKey, ttl: this.CACHE_TTL }
    );
  }

  /**
   * Fetch fundraiser statistics efficiently
   */
  async getFundraiserStats(fundraiserIds: string[]): Promise<Record<string, FundraiserStats>> {
    if (fundraiserIds.length === 0) return {};

    const cacheKey = `fundraiser-stats:${fundraiserIds.sort().join(',')}`;

    return apiService.executeWithCache(
      async () => {
        // Get fundraiser details for days calculation
        const { data: fundraisers, error: fundraiserError } = await supabase
          .from('fundraisers')
          .select('id, end_date')
          .in('id', fundraiserIds);

        if (fundraiserError) {
          throw new ApiError(
            `Failed to fetch fundraiser details: ${fundraiserError.message}`,
            fundraiserError.code,
            undefined,
            true
          );
        }

        // Get stats from the aggregated view
        const { data: statsData, error: statsError } = await supabase
          .from('public_fundraiser_stats')
          .select('fundraiser_id, donor_count, total_raised')
          .in('fundraiser_id', fundraiserIds);

        if (statsError) {
          throw new ApiError(
            `Failed to fetch fundraiser stats: ${statsError.message}`,
            statsError.code,
            undefined,
            true
          );
        }

        // Combine data
        const statsMap: Record<string, FundraiserStats> = {};
        
        fundraisers?.forEach(fundraiser => {
          const stat = statsData?.find(s => s.fundraiser_id === fundraiser.id);
          
          // Calculate days left
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

        return statsMap;
      },
      { key: cacheKey, ttl: this.CACHE_TTL / 2 } // Shorter cache for stats
    );
  }

  /**
   * Fetch single fundraiser by slug
   */
  async getFundraiserBySlug(slug: string): Promise<Fundraiser | null> {
    const cacheKey = `fundraiser:${slug}`;

    return apiService.executeWithCache(
      async () => {
        const { data, error } = await supabase
          .from('fundraisers')
          .select('*')
          .eq('slug', slug)
          .eq('visibility', 'public')
          .maybeSingle();

        if (error) {
          throw new ApiError(
            `Failed to fetch fundraiser: ${error.message}`,
            error.code,
            undefined,
            true
          );
        }

        // Fetch owner profile securely using RPC
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

        return data;
      },
      { key: cacheKey, ttl: this.CACHE_TTL }
    );
  }

  /**
   * Clear fundraiser-related cache
   */
  clearCache(pattern?: string): void {
    apiService.clearCache(pattern || 'fundraiser*');
  }
}

export const fundraiserService = new FundraiserService();