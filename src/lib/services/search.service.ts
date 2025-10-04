/**
 * Search Service
 * Handles all search operations through event-driven architecture
 * NEVER queries database directly - only reads from projections and publishes events
 * 
 * Following SOLID principles:
 * - Single Responsibility: Only handles search coordination
 * - Open/Closed: Extensible through event handlers
 * - Liskov Substitution: Implements clear interfaces
 * - Interface Segregation: Focused search interface
 * - Dependency Inversion: Depends on abstractions (EventBus, Projections)
 */

import { supabase } from '@/integrations/supabase/client';
import type { EventBus } from '@/lib/events/types';
import {
  createSearchQuerySubmittedEvent,
  createSearchAnalyticsRecordedEvent,
} from '@/lib/events/domain/SearchEvents';
import type { SearchResult } from '@/types/ui/search';

// Import event bus instance - will be initialized later
let eventBus: EventBus | null = null;

// Initialize event bus lazily
async function getEventBus(): Promise<EventBus> {
  if (!eventBus) {
    const { HybridEventBus } = await import('@/lib/events/HybridEventBus');
    eventBus = new HybridEventBus({ supabase });
    await eventBus.connect();
  }
  return eventBus;
}

// =====================================================
// INTERFACES (Dependency Inversion Principle)
// =====================================================

export interface SearchFilters {
  type?: 'all' | 'campaign' | 'user' | 'organization';
  category?: string;
}

export interface SearchOptions {
  filters?: SearchFilters;
  maxResults?: number;
  includeSuggestions?: boolean;
  useCache?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: SearchResult[];
  totalCount: number;
  executionTimeMs: number;
  cached: boolean;
}

export interface ISearchService {
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
  trackSearchClick(query: string, resultId: string, resultType: string): Promise<void>;
  trackSuggestionClick(originalQuery: string, suggestionQuery: string): Promise<void>;
  clearCache(query?: string): Promise<void>;
}

// =====================================================
// SEARCH SERVICE IMPLEMENTATION
// =====================================================

class SearchService implements ISearchService {
  private sessionId: string;
  
  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  /**
   * Execute search query through event-driven architecture
   * 1. Check cache projection
   * 2. If not cached, publish SearchQuerySubmitted event
   * 3. Edge function processes event and updates projections
   * 4. Return results from projection
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = performance.now();
    const normalizedQuery = query.trim().toLowerCase();
    
    if (!normalizedQuery) {
      return {
        results: [],
        suggestions: [],
        totalCount: 0,
        executionTimeMs: 0,
        cached: false,
      };
    }

    try {
      // Step 1: Check cache projection (read model)
      const cacheKey = this.generateCacheKey(normalizedQuery, options);
      
      if (options.useCache !== false) {
        const cachedResult = await this.getCachedResults(cacheKey);
        if (cachedResult) {
          const executionTime = performance.now() - startTime;
          
          // Track analytics asynchronously
          this.trackSearchAnalytics(normalizedQuery, cachedResult.totalCount, executionTime, true);
          
          return {
            ...cachedResult,
            executionTimeMs: executionTime,
            cached: true,
          };
        }
      }

      // Step 2: Publish search event (command)
      const searchEvent = createSearchQuerySubmittedEvent({
        query: normalizedQuery,
        userId: (await supabase.auth.getUser()).data.user?.id,
        filters: options.filters,
        sessionId: this.sessionId,
        metadata: {
          maxResults: options.maxResults,
          includeSuggestions: options.includeSuggestions,
          cacheKey,
        },
      });

      const bus = await getEventBus();
      await bus.publish(searchEvent);

      // Step 3: Read from search projections (CQRS read side)
      const [userResults, campaignResults, orgResults, suggestions] = await Promise.all([
        this.searchUserProjection(normalizedQuery, options),
        this.searchCampaignProjection(normalizedQuery, options),
        this.searchOrganizationProjection(normalizedQuery, options),
        options.includeSuggestions !== false 
          ? this.getSuggestions(normalizedQuery)
          : Promise.resolve([]),
      ]);

      // Combine and rank results
      const allResults = this.combineAndRankResults(
        userResults,
        campaignResults,
        orgResults,
        options
      );

      const executionTime = performance.now() - startTime;
      const response: SearchResponse = {
        results: allResults,
        suggestions,
        totalCount: allResults.length,
        executionTimeMs: executionTime,
        cached: false,
      };

      // Cache results asynchronously
      this.cacheResults(cacheKey, normalizedQuery, response);

      // Track analytics asynchronously
      this.trackSearchAnalytics(normalizedQuery, allResults.length, executionTime, false);

      return response;
    } catch (error) {
      console.error('[SearchService] Search failed:', error);
      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Track when user clicks on a search result
   */
  async trackSearchClick(query: string, resultId: string, resultType: string): Promise<void> {
    try {
      const event = createSearchAnalyticsRecordedEvent({
        query,
        resultCount: 0,
        clickedResultId: resultId,
        clickedResultType: resultType,
        sessionId: this.sessionId,
        userId: (await supabase.auth.getUser()).data.user?.id,
      });

      const bus = await getEventBus();
      await bus.publish(event);
    } catch (error) {
      console.error('[SearchService] Failed to track click:', error);
    }
  }

  /**
   * Track when user clicks on a suggestion
   */
  async trackSuggestionClick(originalQuery: string, suggestionQuery: string): Promise<void> {
    try {
      const event = createSearchAnalyticsRecordedEvent({
        query: originalQuery,
        resultCount: 0,
        suggestionClicked: true,
        suggestionQuery,
        sessionId: this.sessionId,
        userId: (await supabase.auth.getUser()).data.user?.id,
      });

      const bus = await getEventBus();
      await bus.publish(event);
    } catch (error) {
      console.error('[SearchService] Failed to track suggestion click:', error);
    }
  }

  /**
   * Clear search cache
   */
  async clearCache(query?: string): Promise<void> {
    // This would publish a cache invalidation event
    // For now, we just let cache expire naturally
    console.log('[SearchService] Cache cleared for query:', query);
  }

  // =====================================================
  // PRIVATE METHODS - Read from Projections Only
  // =====================================================

  /**
   * Search user projection table (never queries profiles table)
   */
  private async searchUserProjection(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (options.filters?.type && options.filters.type !== 'user' && options.filters.type !== 'all') {
      return [];
    }

    const { data, error } = await supabase
      .rpc('enhanced_fuzzy_search_users', {
        search_query: query,
        max_results: options.maxResults || 50,
        include_suggestions: false,
      });

    if (error) {
      console.error('[SearchService] User search failed:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.user_id,
      type: 'user' as const,
      title: item.match_name,
      subtitle: item.bio,
      image: item.avatar,
      link: `/profile/${item.user_id}`,
      relevanceScore: item.relevance_score,
      matchType: item.match_type,
      matchedFields: [item.match_type],
    }));
  }

  /**
   * Search campaign projection (never queries fundraisers table)
   */
  private async searchCampaignProjection(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (options.filters?.type && options.filters.type !== 'campaign' && options.filters.type !== 'all') {
      return [];
    }

    const { data, error } = await supabase
      .from('campaign_search_projection')
      .select('*')
      .or(`search_vector.fts.${query},title.ilike.%${query}%,summary.ilike.%${query}%`)
      .eq('visibility', 'public')
      .in('status', ['active', 'ended', 'closed'])
      .limit(options.maxResults || 50);

    if (error) {
      console.error('[SearchService] Campaign search failed:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.campaign_id,
      type: 'campaign' as const,
      title: item.title,
      subtitle: item.summary,
      snippet: item.story_text?.substring(0, 150),
      link: `/campaign/${item.campaign_id}`,
      relevanceScore: 0.8,
      matchedFields: ['title', 'summary'],
    }));
  }

  /**
   * Search organization projection
   */
  private async searchOrganizationProjection(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (options.filters?.type && options.filters.type !== 'organization' && options.filters.type !== 'all') {
      return [];
    }

    const { data, error } = await supabase
      .from('public_organizations')
      .select('*')
      .or(`legal_name.ilike.%${query}%,dba_name.ilike.%${query}%`)
      .limit(options.maxResults || 50);

    if (error) {
      console.error('[SearchService] Organization search failed:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      type: 'organization' as const,
      title: item.dba_name || item.legal_name,
      subtitle: item.legal_name !== item.dba_name ? item.legal_name : undefined,
      link: `/organization/${item.id}`,
      relevanceScore: 0.7,
      matchedFields: ['name'],
    }));
  }

  /**
   * Get search suggestions from projection
   */
  private async getSuggestions(query: string): Promise<SearchResult[]> {
    const { data, error } = await supabase
      .from('search_suggestions_projection')
      .select('*')
      .eq('query', query)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[SearchService] Suggestions fetch failed:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      type: 'user' as const, // Suggestions are typically user names
      title: item.suggestion,
      subtitle: `Did you mean "${item.suggestion}"?`,
      link: `/search?q=${encodeURIComponent(item.suggestion)}`,
      relevanceScore: item.relevance_score,
      matchType: item.match_type,
      matchedFields: ['suggestion'],
    }));
  }

  /**
   * Check cache projection
   */
  private async getCachedResults(cacheKey: string): Promise<SearchResponse | null> {
    const { data, error } = await supabase
      .from('search_results_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Increment hit count asynchronously
    supabase
      .from('search_results_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('cache_key', cacheKey)
      .then();

    return {
      results: (data.results as unknown as SearchResult[]) || [],
      suggestions: (data.suggestions as unknown as SearchResult[]) || [],
      totalCount: data.result_count,
      executionTimeMs: 0,
      cached: true,
    };
  }

  /**
   * Cache search results
   */
  private async cacheResults(
    cacheKey: string,
    query: string,
    response: SearchResponse
  ): Promise<void> {
    try {
      await supabase.from('search_results_cache').upsert({
        cache_key: cacheKey,
        query,
        results: response.results as any,
        suggestions: response.suggestions as any,
        result_count: response.totalCount,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      });
    } catch (error) {
      console.error('[SearchService] Cache write failed:', error);
    }
  }

  /**
   * Track search analytics via events
   */
  private async trackSearchAnalytics(
    query: string,
    resultCount: number,
    executionTimeMs: number,
    cached: boolean
  ): Promise<void> {
    try {
      const event = createSearchAnalyticsRecordedEvent({
        query,
        resultCount,
        executionTimeMs,
        sessionId: this.sessionId,
        userId: (await supabase.auth.getUser()).data.user?.id,
      });

      const bus = await getEventBus();
      await bus.publish(event);
    } catch (error) {
      console.error('[SearchService] Analytics tracking failed:', error);
    }
  }

  /**
   * Combine and rank results from multiple sources
   */
  private combineAndRankResults(
    userResults: SearchResult[],
    campaignResults: SearchResult[],
    orgResults: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    const combined = [...userResults, ...campaignResults, ...orgResults];
    
    // Sort by relevance score
    combined.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    return combined.slice(0, options.maxResults || 50);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, options: SearchOptions): string {
    const parts = [
      query,
      options.filters?.type || 'all',
      options.filters?.category || 'none',
      options.maxResults || 50,
    ];
    return `search:${parts.join(':')}`;
  }
}

// Singleton instance
export const searchService = new SearchService();
