/**
 * Optimized Search Hook - Phase 3 & 4 Implementation
 * Uses projection tables with database-side FTS for maximum performance
 * Eliminates all client-side scoring and HTML parsing
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheService } from '@/lib/services/cache.service';

export interface SearchResult {
  id: string;
  type: 'campaign' | 'user' | 'organization';
  title: string;
  subtitle?: string;
  image?: string;
  slug?: string;
  location?: string;
  link: string;
  snippet?: string;
  relevanceScore?: number;
  matchedFields?: string[];
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  matchedSnippet?: string;
  matchedIn?: string;
}

interface UseSearchOptions {
  query: string;
  enabled?: boolean;
}

const BATCH_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Simple client-side highlighting for display
 */
function highlightText(text: string, searchQuery: string): string {
  if (!text || !searchQuery) return text;
  
  const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  let result = text;
  
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  
  return result;
}

/**
 * Extract relevant snippet from text
 */
function extractSnippet(text: string, searchQuery: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    return text.slice(0, maxLength) + '...';
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

/**
 * Subscribe to real-time projection updates
 */
function subscribeToProjectionUpdates(callback: () => void) {
  const channel = supabase
    .channel('search-projections')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaign_search_projection'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaign_summary_projection'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Optimized search hook using projection tables
 * Phase 3 & 4 implementation
 */
export function useSearch(options: UseSearchOptions) {
  const { query, enabled = true } = options;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Reset results when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2 || !enabled) {
      setResults([]);
      setHasMore(false);
      setOffset(0);
      return;
    }

    setOffset(0);
    performSearch(query, 0, true);
  }, [query, enabled]);

  // Real-time subscription to projection updates (Phase 4)
  useEffect(() => {
    if (!enabled || !query || query.length < 2) return;
    
    const unsubscribe = subscribeToProjectionUpdates(() => {
      // Invalidate cache and refresh results when projections update
      cacheService.invalidateByPattern(`search:${query}*`);
      if (results.length > 0) {
        performSearch(query, 0, true);
      }
    });

    return unsubscribe;
  }, [enabled, query]);

  const performSearch = useCallback(async (searchQuery: string, currentOffset: number, isNewSearch: boolean = false) => {
    if (isNewSearch) {
      setLoading(true);
    }
    setError(null);

    // Check cache first (Phase 4)
    const cacheKey = `search:${searchQuery}:${currentOffset}`;
    const cached = await cacheService.get<SearchResult[]>(cacheKey);
    
    if (cached && cached.length > 0) {
      if (isNewSearch) {
        setResults(cached);
      } else {
        setResults(prev => [...prev, ...cached]);
      }
      setHasMore(cached.length === BATCH_SIZE);
      setLoading(false);
      return;
    }

    try {
      const tsQuery = searchQuery.trim();
      
      // Phase 3: Use projection tables for campaigns (massive performance boost)
      // No client-side scoring needed - PostgreSQL already ranks by relevance!
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaign_search_projection')
        .select('campaign_id, title, summary, story_text, beneficiary_name, location, category_name, owner_name')
        .textSearch('search_vector', tsQuery, {
          type: 'websearch',
          config: 'english'
        })
        .eq('visibility', 'public')
        .in('status', ['active', 'ended', 'closed'])
        .limit(BATCH_SIZE)
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      // Get summary data for images and other display info
      const campaignIds = campaigns?.map(c => c.campaign_id) || [];
      const { data: campaignSummaries } = campaignIds.length > 0 ? await supabase
        .from('campaign_summary_projection')
        .select('campaign_id, slug, cover_image, owner_avatar')
        .in('campaign_id', campaignIds) : { data: [] };

      const summaryMap: Record<string, any> = {};
      campaignSummaries?.forEach((summary: any) => {
        summaryMap[summary.campaign_id] = summary;
      });

      // Multi-strategy user search: FTS + Fuzzy + Phonetic fallback
      let users: any[] = [];
      let usersError = null;

      try {
        // Strategy 1: Try FTS first (fastest, most accurate)
        const { data: ftsUsers, error: ftsErr } = await supabase
          .from('public_profiles')
          .select('id, name, avatar, bio, role, campaign_count, follower_count')
          .textSearch('fts', tsQuery, {
            type: 'websearch',
            config: 'english'
          })
          .limit(BATCH_SIZE);

        if (ftsErr) {
          console.error('[useSearch] FTS error:', ftsErr);
          usersError = ftsErr;
        }

        users = ftsUsers || [];

        // Strategy 2: If FTS returns few results, try fuzzy search function
        if (users.length < 3) {
          const { data: fuzzyUsers, error: fuzzyError } = await supabase
            .rpc('fuzzy_search_users', { 
              search_query: tsQuery,
              similarity_threshold: 0.3
            });

          if (fuzzyError) {
            console.error('[useSearch] Fuzzy search error:', fuzzyError);
          } else if (fuzzyUsers && fuzzyUsers.length > 0) {
            // Merge fuzzy results with FTS results, deduplicate by user_id
            const existingIds = new Set(users.map((u: any) => u.id));
            const newFuzzyUsers = fuzzyUsers
              .filter((fu: any) => !existingIds.has(fu.user_id))
              .map((fu: any) => ({
                id: fu.user_id,
                name: fu.match_name,
                matchType: fu.match_type,
                relevanceScore: fu.relevance_score,
              }));
            
            users = [...users, ...newFuzzyUsers].slice(0, BATCH_SIZE);
            console.log(`[useSearch] Fuzzy search added ${newFuzzyUsers.length} results (types: ${newFuzzyUsers.map(u => u.matchType).join(', ')})`);
          }
        }

        // Fetch full profile data for fuzzy matches that only have partial data
        const userIdsNeedingData = users
          .filter((u: any) => !u.avatar && !u.role)
          .map((u: any) => u.id);

        if (userIdsNeedingData.length > 0) {
          const { data: fullProfiles } = await supabase
            .from('public_profiles')
            .select('id, avatar, bio, role, campaign_count, follower_count')
            .in('id', userIdsNeedingData);

          if (fullProfiles) {
            const profileMap = new Map(fullProfiles.map(p => [p.id, p]));
            users = users.map((u: any) => ({
              ...u,
              ...profileMap.get(u.id),
              matchType: u.matchType,
              relevanceScore: u.relevanceScore,
            }));
          }
        }

      } catch (error) {
        console.error('[useSearch] User search error:', error);
        usersError = error;
      }

      // Use existing FTS on organizations (already optimized)
      const { data: organizations, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, legal_name, dba_name, website, country, verification_status, categories')
        .textSearch('fts', tsQuery, {
          type: 'websearch',
          config: 'english'
        })
        .limit(BATCH_SIZE);

      if (campaignsError) throw campaignsError;
      if (usersError) throw usersError;
      if (organizationsError) throw organizationsError;

      const newResults: SearchResult[]= [];

      // Process campaigns from projection (no client-side scoring needed!)
      campaigns?.forEach((campaign: any) => {
        const summary = summaryMap[campaign.campaign_id];
        const subtitle = campaign.owner_name ? `by ${campaign.owner_name}` : undefined;
        
        newResults.push({
          id: campaign.campaign_id,
          type: 'campaign',
          title: campaign.title,
          subtitle,
          image: summary?.cover_image,
          slug: summary?.slug,
          location: campaign.location,
          link: `/fundraiser/${summary?.slug || campaign.campaign_id}`,
          snippet: highlightText(
            extractSnippet(campaign.summary || campaign.story_text || '', searchQuery),
            searchQuery
          ),
          relevanceScore: 1, // PostgreSQL already ranked by relevance
          highlightedTitle: highlightText(campaign.title, searchQuery),
          highlightedSubtitle: subtitle ? highlightText(subtitle, searchQuery) : undefined,
          matchedFields: ['title', 'summary'], // Database matched these
          matchedIn: 'campaign'
        });
      });

      // Process users (FTS + fuzzy + phonetic results combined)
      users?.forEach((user: any) => {
        const subtitle = `${user.role || 'visitor'} • ${user.campaign_count || 0} campaigns`;
        const matchTypeLabel = user.matchType ? ` (${user.matchType} match)` : '';
        
        newResults.push({
          id: user.id,
          type: 'user',
          title: user.name || 'Anonymous User',
          subtitle: subtitle + matchTypeLabel,
          image: user.avatar,
          link: `/profile/${user.id}`,
          snippet: highlightText(
            extractSnippet(user.bio || `${user.name}'s profile`, searchQuery),
            searchQuery
          ),
          relevanceScore: user.relevanceScore || 1,
          highlightedTitle: highlightText(user.name || 'Anonymous User', searchQuery),
          highlightedSubtitle: highlightText(subtitle, searchQuery),
          matchedFields: ['name', 'bio'],
          matchedIn: user.matchType ? `user profile (${user.matchType})` : 'user profile'
        });
      });

      // Process organizations (database already ranked)
      organizations?.forEach((org: any) => {
        const displayName = org.dba_name || org.legal_name;
        let subtitle = '';
        
        if (org.country) {
          subtitle = org.country;
        }
        if (org.categories && org.categories.length > 0) {
          const categoryText = org.categories.slice(0, 2).join(', ');
          subtitle = subtitle ? `${subtitle} • ${categoryText}` : categoryText;
        }
        
        newResults.push({
          id: org.id,
          type: 'organization',
          title: displayName,
          subtitle,
          image: undefined,
          link: `/organization/${org.id}`,
          snippet: `${org.verification_status} organization`,
          relevanceScore: 1,
          highlightedTitle: highlightText(displayName, searchQuery),
          highlightedSubtitle: subtitle ? highlightText(subtitle, searchQuery) : undefined,
          matchedFields: ['legal_name', 'dba_name'],
          matchedIn: 'organization'
        });
      });

      // Cache results (Phase 4)
      if (newResults.length > 0) {
        await cacheService.set(cacheKey, newResults, { ttl: CACHE_TTL });
      }

      // Update state
      if (isNewSearch) {
        setResults(newResults);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }

      setOffset(currentOffset + BATCH_SIZE);
      setHasMore(newResults.length === BATCH_SIZE);
      
      // Track search analytics (Phase 4)
      if (isNewSearch && newResults.length > 0) {
        console.log('[Search Analytics]', {
          query: searchQuery,
          resultCount: newResults.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = () => {
    if (!loading && hasMore && query.trim().length >= 2) {
      performSearch(query, offset, false);
    }
  };

  return {
    results,
    loading,
    error,
    hasMore,
    loadMore
  };
}
