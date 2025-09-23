/**
 * API Documentation Search page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsSearch() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Search API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Search across fundraisers, organizations, and user profiles with advanced filtering and ranking.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Search results respect visibility and privacy settings. Only public fundraisers and profiles are included in search results.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Search Operations" 
        description="Full-text search across multiple content types with relevance ranking."
      >
        {/* Global Search */}
        <SwaggerEndpoint
          method="GET"
          path="/search"
          summary="Global search"
          description="Search across fundraisers, organizations, and profiles"
          tags={['Search']}
        >
          <EndpointDetails
            parameters={[
              { name: 'q', type: 'string', required: true, description: 'Search query', example: 'medical emergency' },
              { name: 'type', type: 'string', description: 'Content type filter (fundraisers, organizations, profiles, all)', example: 'fundraisers' },
              { name: 'category', type: 'string', description: 'Category filter for fundraisers', example: 'medical' },
              { name: 'location', type: 'string', description: 'Location filter', example: 'Austin, TX' },
              { name: 'limit', type: 'integer', description: 'Number of results (max 100)', example: '20' },
              { name: 'offset', type: 'integer', description: 'Pagination offset', example: '0' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Mixed search results with relevance ranking',
                example: `{
  "results": [
    {
      "type": "fundraiser",
      "relevance_score": 0.95,
      "data": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Emergency Medical Fund for Sarah",
        "summary": "Help cover medical expenses for emergency surgery",
        "goal_amount": 15000,
        "total_raised": 8750.50,
        "status": "active",
        "cover_image": "https://example.com/image.jpg",
        "location": "Austin, TX",
        "profiles": {
          "name": "John Doe",
          "avatar": "https://example.com/avatar.jpg"
        },
        "categories": {
          "name": "Medical",
          "emoji": "🏥"
        }
      }
    },
    {
      "type": "organization",
      "relevance_score": 0.87,
      "data": {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "legal_name": "Austin Emergency Medical Fund",
        "dba_name": "Emergency Medical Support",
        "verification_status": "verified",
        "categories": ["medical", "emergency"]
      }
    },
    {
      "type": "profile",
      "relevance_score": 0.73,
      "data": {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "Dr. Sarah Johnson",
        "bio": "Emergency medicine physician helping families in crisis",
        "avatar": "https://example.com/avatar.jpg",
        "campaign_count": 3
      }
    }
  ],
  "total_results": 47,
  "search_time_ms": 125
}`
              },
              { status: '400', description: 'Invalid search parameters' },
              { status: '500', description: 'Search service error' }
            ]}
            examples={[
              {
                title: 'Global Search Query',
                description: 'Search across all content types',
                code: `// Note: This is a conceptual endpoint. In practice, you would
// search each table separately and combine results

// Search fundraisers
const { data: fundraisers } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .or(\`title.ilike.%\${query}%,summary.ilike.%\${query}%\`)
  .eq('status', 'active')
  .eq('visibility', 'public')

// Search organizations  
const { data: orgs } = await supabase
  .from('organizations')
  .select('*')
  .or(\`legal_name.ilike.%\${query}%,dba_name.ilike.%\${query}%\`)
  .eq('verification_status', 'verified')

// Search profiles
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .or(\`name.ilike.%\${query}%,bio.ilike.%\${query}%\`)
  .eq('profile_visibility', 'public')`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Search Fundraisers */}
        <SwaggerEndpoint
          method="GET"
          path="/fundraisers/search"
          summary="Search fundraisers"
          description="Full-text search specifically for fundraising campaigns"
          tags={['Search']}
        >
          <EndpointDetails
            parameters={[
              { name: 'q', type: 'string', required: true, description: 'Search query', example: 'food bank' },
              { name: 'category_id', type: 'uuid', description: 'Filter by category', example: '123e4567-e89b-12d3-a456-426614174000' },
              { name: 'status', type: 'string', description: 'Filter by status', example: 'active' },
              { name: 'location', type: 'string', description: 'Location filter', example: 'Austin, TX' },
              { name: 'min_goal', type: 'number', description: 'Minimum goal amount', example: '1000' },
              { name: 'max_goal', type: 'number', description: 'Maximum goal amount', example: '10000' },
              { name: 'sort', type: 'string', description: 'Sort order (relevance, created_at, goal_amount)', example: 'relevance' },
              { name: 'limit', type: 'integer', description: 'Number of results', example: '20' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of matching fundraisers with relevance ranking',
                example: `[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Support Local Food Bank Initiative",
    "summary": "Help us provide meals to 500+ families this holiday season",
    "goal_amount": 8000,
    "total_raised": 3250.75,
    "donor_count": 42,
    "status": "active",
    "location": "Austin, TX",
    "cover_image": "https://example.com/image.jpg",
    "tags": ["food", "community", "families"],
    "created_at": "2024-01-10T10:30:00Z",
    "profiles": {
      "name": "Community Kitchen",
      "avatar": "https://example.com/avatar.jpg"
    },
    "categories": {
      "name": "Community",
      "emoji": "🏘️"
    },
    "relevance_score": 0.92
  }
]`
              }
            ]}
            examples={[
              {
                title: 'Search Fundraisers with Filters',
                code: `const searchQuery = 'food bank'
const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .or(\`title.ilike.%\${searchQuery}%,summary.ilike.%\${searchQuery}%,story_html.ilike.%\${searchQuery}%\`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .gte('goal_amount', 1000)
  .lte('goal_amount', 10000)
  .order('created_at', { ascending: false })
  .range(0, 19)`
              },
              {
                title: 'Location-Based Search',
                description: 'Find fundraisers in a specific location',
                code: `const { data, error } = await supabase
  .from('fundraisers') 
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .ilike('location', '%Austin, TX%')
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Search with Autocomplete */}
        <SwaggerEndpoint
          method="GET"
          path="/search/autocomplete"
          summary="Search autocomplete"
          description="Get search suggestions and autocomplete results"
          tags={['Search']}
        >
          <EndpointDetails
            parameters={[
              { name: 'q', type: 'string', required: true, description: 'Partial search query', example: 'medic' },
              { name: 'type', type: 'string', description: 'Content type to suggest', example: 'fundraisers' },
              { name: 'limit', type: 'integer', description: 'Number of suggestions', example: '10' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of search suggestions',
                example: `{
  "suggestions": [
    {
      "text": "medical emergency",
      "type": "query",
      "count": 23
    },
    {
      "text": "medical expenses",
      "type": "query", 
      "count": 18
    },
    {
      "text": "Emergency Medical Fund for Sarah",
      "type": "fundraiser",
      "id": "123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "text": "Medical",
      "type": "category",
      "id": "456e7890-e89b-12d3-a456-426614174000"
    }
  ]
}`
              }
            ]}
            examples={[
              {
                title: 'Get Search Suggestions',
                code: `// Autocomplete implementation
const getSuggestions = async (query) => {
  const [fundraisers, categories] = await Promise.all([
    supabase
      .from('fundraisers')
      .select('title, id')
      .ilike('title', \`%\${query}%\`)
      .eq('status', 'active')
      .limit(5),
    supabase
      .from('categories')
      .select('name, id')
      .ilike('name', \`%\${query}%\`)
      .eq('is_active', true)
      .limit(3)
  ])
  
  return {
    fundraisers: fundraisers.data,
    categories: categories.data
  }
}`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Advanced Search Features" description="Complex search patterns and optimization techniques">
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Full-Text Search with Ranking</h4>
            <p className="text-sm text-muted-foreground mb-3">Implement relevance scoring for better search results</p>
            <CodeBlock 
              code={`// PostgreSQL full-text search with ranking
const { data, error } = await supabase
  .rpc('search_fundraisers', {
    search_query: 'medical emergency fund',
    match_count: 20
  })

// This would call a custom PostgreSQL function like:
/*
CREATE OR REPLACE FUNCTION search_fundraisers(search_query text, match_count int)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.title,
    f.summary,
    ts_rank(to_tsvector('english', f.title || ' ' || COALESCE(f.summary, '')), plainto_tsquery('english', search_query)) as rank
  FROM fundraisers f
  WHERE to_tsvector('english', f.title || ' ' || COALESCE(f.summary, '')) @@ plainto_tsquery('english', search_query)
    AND f.status = 'active'
    AND f.visibility = 'public'
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
*/`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Geographic Search</h4>
            <p className="text-sm text-muted-foreground mb-3">Find fundraisers within a specific radius</p>
            <CodeBlock 
              code={`// Search fundraisers near a location (requires PostGIS)
const { data, error } = await supabase
  .rpc('search_fundraisers_near_location', {
    latitude: 30.2672,   // Austin, TX
    longitude: -97.7431,
    radius_miles: 50,
    search_term: 'community'
  })

// This would use a PostGIS function to search within radius
// Alternatively, use basic location string matching:
const { data } = await supabase
  .from('fundraisers')
  .select('*')
  .or('location.ilike.%Austin%,location.ilike.%TX%')
  .eq('status', 'active')`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Search Analytics</h4>
            <p className="text-sm text-muted-foreground mb-3">Track popular search terms and user behavior</p>
            <CodeBlock 
              code={`// Log search queries for analytics
const logSearch = async (query, resultCount, userId = null) => {
  await supabase
    .from('search_analytics')
    .insert([{
      query: query,
      result_count: resultCount,
      user_id: userId,
      searched_at: new Date().toISOString()
    }])
}

// Get popular search terms
const { data: popularSearches } = await supabase
  .from('search_analytics')
  .select('query, count(*)')
  .gte('searched_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  .group('query')
  .order('count', { ascending: false })
  .limit(10)`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Advanced Filtering</h4>
            <p className="text-sm text-muted-foreground mb-3">Combine multiple search criteria for precise results</p>
            <CodeBlock 
              code={`// Complex search with multiple filters
const advancedSearch = async (filters) => {
  let query = supabase
    .from('fundraisers')
    .select(\`
      *,
      profiles(name, avatar),
      categories(name, emoji)
    \`)
    .eq('status', 'active')
    .eq('visibility', 'public')

  // Add text search if provided
  if (filters.searchTerm) {
    query = query.or(\`title.ilike.%\${filters.searchTerm}%,summary.ilike.%\${filters.searchTerm}%\`)
  }

  // Add category filter
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  // Add goal amount range
  if (filters.minGoal) {
    query = query.gte('goal_amount', filters.minGoal)
  }
  if (filters.maxGoal) {
    query = query.lte('goal_amount', filters.maxGoal)
  }

  // Add location filter
  if (filters.location) {
    query = query.ilike('location', \`%\${filters.location}%\`)
  }

  // Add date range
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  return query.order('created_at', { ascending: false })
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}