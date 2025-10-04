/**
 * Search API - API Gateway for all search operations
 * 
 * This edge function serves as the single entry point for search requests,
 * abstracting the underlying implementation (RediSearch, PostgreSQL projections, etc.)
 * 
 * Endpoints:
 * - GET /search?q=<query>&scope=<all|users|campaigns|orgs>&limit=<20>&cursor=<token>
 * - GET /search/suggest?q=<query>&limit=<10>
 * - GET /search/health
 * 
 * @see docs/search/architecture.md
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  q: string;
  scope?: 'all' | 'users' | 'campaigns' | 'orgs';
  limit?: number;
  offset?: number;
  filters?: {
    category?: string;
    location?: string;
    status?: string;
    visibility?: string;
  };
}

interface SearchResult {
  id: string;
  type: 'user' | 'campaign' | 'organization';
  title: string;
  subtitle?: string;
  snippet?: string;
  link: string;
  score?: number;
  highlights?: Record<string, string>;
  image?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  executionTimeMs: number;
  cached: boolean;
  suggestions?: string[];
  cursor?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route: Health check
    if (path.endsWith('/health')) {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Route: Search suggestions (typeahead)
    if (path.endsWith('/suggest')) {
      const query = url.searchParams.get('q') || '';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

      if (!query || query.length < 2) {
        return new Response(
          JSON.stringify({ suggestions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Query search suggestions projection
      const { data: suggestions, error } = await supabase
        .from('search_suggestions_projection')
        .select('suggestion, relevance_score, usage_count')
        .ilike('suggestion', `${query}%`)
        .order('relevance_score', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching suggestions:', error);
        return new Response(
          JSON.stringify({ suggestions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const executionTimeMs = performance.now() - startTime;
      return new Response(
        JSON.stringify({
          suggestions: suggestions?.map(s => s.suggestion) || [],
          executionTimeMs: Math.round(executionTimeMs),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Route: Main search
    if (path.endsWith('/search')) {
      const params: SearchParams = {
        q: url.searchParams.get('q') || '',
        scope: (url.searchParams.get('scope') as SearchParams['scope']) || 'all',
        limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
        offset: Math.max(parseInt(url.searchParams.get('offset') || '0'), 0),
      };

      // Validate query
      if (!params.q || params.q.length < 2) {
        return new Response(
          JSON.stringify({
            results: [],
            total: 0,
            executionTimeMs: 0,
            cached: false,
            error: 'Query must be at least 2 characters',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check cache first
      const cacheKey = generateCacheKey(params);
      const { data: cachedResults } = await supabase
        .from('search_results_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cachedResults) {
        const executionTimeMs = performance.now() - startTime;
        return new Response(
          JSON.stringify({
            ...cachedResults.results,
            executionTimeMs: Math.round(executionTimeMs),
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Execute search across projections
      const searchResults = await executeSearch(supabase, params);
      const executionTimeMs = performance.now() - startTime;

      const response: SearchResponse = {
        ...searchResults,
        executionTimeMs: Math.round(executionTimeMs),
        cached: false,
      };

      // Background: Cache results (fire and forget)
      EdgeRuntime.waitUntil(
        cacheSearchResults(supabase, cacheKey, params.q, response).catch(err =>
          console.error('Failed to cache results:', err)
        )
      );

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (error) {
    console.error('Search API error:', error);
    const executionTimeMs = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        executionTimeMs: Math.round(executionTimeMs),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Execute search query across projection tables
 */
async function executeSearch(
  supabase: any,
  params: SearchParams
): Promise<Omit<SearchResponse, 'executionTimeMs' | 'cached'>> {
  const { q, scope, limit = 20, offset = 0 } = params;
  const normalizedQuery = q.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Search users if scope includes them
  if (scope === 'all' || scope === 'users') {
    const { data: users } = await supabase
      .from('user_search_projection')
      .select('user_id, name, avatar, bio, role, follower_count, campaign_count')
      .or(`name.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
      .limit(scope === 'users' ? limit : Math.ceil(limit / 3));

    if (users) {
      results.push(
        ...users.map((user: any) => ({
          id: user.user_id,
          type: 'user' as const,
          title: user.name,
          subtitle: user.role,
          snippet: user.bio?.substring(0, 150),
          link: `/profile/${user.user_id}`,
          score: calculateRelevance(user.name, normalizedQuery),
          image: user.avatar,
        }))
      );
    }
  }

  // Search campaigns if scope includes them
  if (scope === 'all' || scope === 'campaigns') {
    console.log('Searching campaigns with query:', q);
    
    const searchPattern = `%${q}%`;
    
    // Build query with multiple filters
    let campaignQuery = supabase
      .from('campaign_search_projection')
      .select('campaign_id, slug, title, summary, story_text, category_name, location, status, visibility, beneficiary_name')
      .eq('visibility', 'public')
      .in('status', ['active', 'ended', 'closed']);
    
    // Apply search filters
    campaignQuery = campaignQuery.or(
      `title.ilike.${searchPattern},` +
      `summary.ilike.${searchPattern},` +
      `story_text.ilike.${searchPattern},` +
      `beneficiary_name.ilike.${searchPattern},` +
      `location.ilike.${searchPattern}`
    );
    
    campaignQuery = campaignQuery.limit(scope === 'campaigns' ? limit : Math.ceil(limit / 3));
    
    const { data: campaigns, error: campaignsError } = await campaignQuery;

    if (campaignsError) {
      console.error('Campaign search error:', campaignsError);
    } else {
      console.log('Found campaigns:', campaigns?.length || 0);
      if (campaigns && campaigns.length > 0) {
        console.log('Sample campaign:', campaigns[0].title);
      }
    }

    if (campaigns && campaigns.length > 0) {
      results.push(
        ...campaigns.map((campaign: any) => ({
          id: campaign.campaign_id,
          type: 'campaign' as const,
          title: campaign.title,
          subtitle: campaign.category_name || campaign.location,
          snippet: campaign.summary?.substring(0, 150),
          link: `/fundraiser/${campaign.slug}`,
          score: calculateRelevance(
            `${campaign.title} ${campaign.summary || ''}`, 
            normalizedQuery
          ),
        }))
      );
    }
  }

  // Search organizations if scope includes them
  if (scope === 'all' || scope === 'orgs') {
    const { data: orgs } = await supabase
      .from('organization_search_projection')
      .select('org_id, legal_name, dba_name, website, country, verification_status')
      .or(`legal_name.ilike.%${q}%,dba_name.ilike.%${q}%`)
      .limit(scope === 'orgs' ? limit : Math.ceil(limit / 3));

    if (orgs) {
      results.push(
        ...orgs.map((org: any) => ({
          id: org.org_id,
          type: 'organization' as const,
          title: org.dba_name || org.legal_name,
          subtitle: `${org.verification_status} • ${org.country}`,
          snippet: org.website,
          link: `/organization/${org.org_id}`,
          score: calculateRelevance(org.dba_name || org.legal_name, normalizedQuery),
        }))
      );
    }
  }

  // Sort by relevance score and apply pagination
  const sortedResults = results.sort((a, b) => (b.score || 0) - (a.score || 0));
  const paginatedResults = sortedResults.slice(offset, offset + limit);

  return {
    results: paginatedResults,
    total: sortedResults.length,
    cursor: sortedResults.length > offset + limit ? `${offset + limit}` : undefined,
  };
}

/**
 * Calculate relevance score for a result
 */
function calculateRelevance(text: string, query: string): number {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerText === lowerQuery) return 1.0;

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) return 0.9;

  // Contains query
  if (lowerText.includes(lowerQuery)) return 0.7;

  // Word boundaries match
  const words = lowerText.split(/\s+/);
  const queryWords = lowerQuery.split(/\s+/);
  const matchCount = queryWords.filter(qw => words.some(w => w.includes(qw))).length;
  return 0.5 * (matchCount / queryWords.length);
}

/**
 * Generate cache key for search params
 */
function generateCacheKey(params: SearchParams): string {
  const { q, scope, limit, filters } = params;
  return `search:${q}:${scope || 'all'}:${JSON.stringify(filters || {})}:${limit || 20}`;
}

/**
 * Cache search results (write-only, fire and forget)
 */
async function cacheSearchResults(
  supabase: any,
  cacheKey: string,
  query: string,
  response: SearchResponse
): Promise<void> {
  try {
    await supabase.from('search_results_cache').upsert({
      cache_key: cacheKey,
      query: query,
      results: response,
      result_count: response.total,
      suggestions: response.suggestions || [],
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour TTL
    });
  } catch (error) {
    console.error('Cache write failed:', error);
    // Don't throw - caching is optional
  }
}

/* === Edge Runtime Global === */
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};
