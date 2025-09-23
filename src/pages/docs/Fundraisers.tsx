/**
 * API Documentation Fundraisers page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsFundraisers() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Fundraisers API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Manage fundraising campaigns with full CRUD operations and advanced filtering.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          All fundraiser operations respect Row Level Security policies. Users can only modify their own campaigns.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Fundraisers API" 
        description="Complete CRUD operations for managing fundraising campaigns with Row Level Security."
      >
        {/* List Fundraisers */}
        <SwaggerEndpoint
          method="GET"
          path="/fundraisers"
          summary="List fundraisers"
          description="Retrieve a paginated list of active public fundraisers with optional filtering"
          tags={['Fundraisers']}
        >
          <EndpointDetails
            parameters={[
              { name: 'status', type: 'string', description: 'Filter by fundraiser status', example: 'active' },
              { name: 'category_id', type: 'uuid', description: 'Filter by category UUID' },
              { name: 'limit', type: 'integer', description: 'Number of results (max 100)', example: '20' },
              { name: 'offset', type: 'integer', description: 'Pagination offset', example: '0' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of fundraiser objects with profiles and categories',
                example: `[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Help Local Food Bank",
    "slug": "help-local-food-bank",
    "summary": "Supporting families in need during tough times",
    "goal_amount": 5000,
    "currency": "USD",
    "status": "active",
    "visibility": "public",
    "cover_image": "https://example.com/image.jpg",
    "location": "Austin, TX",
    "tags": ["community", "food", "families"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "profiles": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "categories": {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "name": "Community",
      "emoji": "🏘️"
    }
  }
]`
              },
              { status: '400', description: 'Bad request - invalid parameters' }
            ]}
            examples={[
              {
                title: 'Direct Supabase Query',
                code: `const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })
  .range(0, 19)`
              },
              {
                title: 'Using Service Layer',
                description: 'Recommended approach with automatic caching and error handling',
                code: `import { fundraiserService } from '@/lib/services/fundraiser.service'

// Get fundraisers with automatic caching
const result = await fundraiserService.getFundraisers({
  status: 'active',
  category: 'medical',
  limit: 20,
  offset: 0
})

console.log('Fundraisers:', result.data)
console.log('Total count:', result.count)`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Single Fundraiser */}
        <SwaggerEndpoint
          method="GET"
          path="/fundraisers/{slug}"
          summary="Get fundraiser details"
          description="Retrieve detailed information about a specific fundraiser by slug"
          tags={['Fundraisers']}
        >
          <EndpointDetails
            parameters={[
              { name: 'slug', type: 'string', required: true, description: 'Fundraiser slug or ID', example: 'help-local-food-bank' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Fundraiser object with statistics and profile data',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Help Local Food Bank",
  "slug": "help-local-food-bank",
  "summary": "Supporting families in need during tough times",
  "story_html": "<p>Our local food bank serves over 500 families...</p>",
  "goal_amount": 5000,
  "currency": "USD",
  "status": "active",
  "visibility": "public",
  "cover_image": "https://example.com/image.jpg",
  "location": "Austin, TX",
  "tags": ["community", "food", "families"],
  "end_date": "2024-12-31",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "total_raised": 1250.50,
  "donor_count": 23,
  "days_left": 45,
  "profiles": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Community organizer passionate about helping families"
  },
  "categories": {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "name": "Community",
    "emoji": "🏘️",
    "color_class": "bg-green-500"
  }
}`
              },
              { status: '404', description: 'Fundraiser not found' }
            ]}
            examples={[
              {
                title: 'Basic Query',
                code: `const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar, bio),
    categories(name, emoji, color_class)
  \`)
  .eq('slug', 'help-local-food-bank')
  .eq('visibility', 'public')
  .single()`
              },
              {
                title: 'With Statistics',
                description: 'Get fundraiser with calculated statistics',
                code: `import { fundraiserService } from '@/lib/services/fundraiser.service'

// Get fundraiser with stats (total raised, donor count, days left)
const fundraiser = await fundraiserService.getFundraiserBySlug('help-local-food-bank')

console.log('Goal:', fundraiser.goal_amount)
console.log('Raised:', fundraiser.total_raised)
console.log('Donors:', fundraiser.donor_count)
console.log('Days left:', fundraiser.days_left)`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Create Fundraiser */}
        <SwaggerEndpoint
          method="POST"
          path="/fundraisers"
          summary="Create fundraiser"
          description="Create a new fundraising campaign"
          tags={['Fundraisers']}
          requiresAuth={true}
        >
          <EndpointDetails
            requestBody={{
              contentType: 'application/json',
              example: `{
  "title": "Help Support Local Food Bank",
  "summary": "Raising funds to support families in need during the holiday season",
  "story_html": "<p>Our local food bank serves over 500 families...</p>",
  "goal_amount": 5000,
  "currency": "USD",
  "category_id": "category-uuid-here",
  "cover_image": "https://example.com/image.jpg",
  "location": "Austin, TX",
  "tags": ["community", "food", "families"],
  "end_date": "2024-12-31"
}`
            }}
            responses={[
              { 
                status: '201', 
                description: 'Fundraiser created successfully',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Help Support Local Food Bank",
  "slug": "help-support-local-food-bank",
  "summary": "Raising funds to support families in need during the holiday season",
  "story_html": "<p>Our local food bank serves over 500 families...</p>",
  "goal_amount": 5000,
  "currency": "USD",
  "status": "draft",
  "visibility": "public",
  "cover_image": "https://example.com/image.jpg",
  "location": "Austin, TX",
  "tags": ["community", "food", "families"],
  "end_date": "2024-12-31",
  "owner_user_id": "456e7890-e89b-12d3-a456-426614174000",
  "category_id": "789e0123-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}`
              },
              { status: '400', description: 'Validation errors' },
              { status: '401', description: 'Authentication required' }
            ]}
            examples={[
              {
                title: 'Create Fundraiser',
                code: `const { data, error } = await supabase
  .from('fundraisers')
  .insert([{
    title: 'Help Support Local Food Bank',
    summary: 'Raising funds to support families in need during the holiday season',
    story_html: '<p>Our local food bank serves over 500 families...</p>',
    goal_amount: 5000,
    currency: 'USD',
    category_id: 'category-uuid-here',
    cover_image: 'https://example.com/image.jpg',
    location: 'Austin, TX',
    tags: ['community', 'food', 'families'],
    end_date: '2024-12-31'
  }])
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Update Fundraiser */}
        <SwaggerEndpoint
          method="PUT"
          path="/fundraisers/{id}"
          summary="Update fundraiser"
          description="Update fundraiser details (owner only)"
          tags={['Fundraisers']}
          requiresAuth={true}
        >
          <EndpointDetails
            parameters={[
              { name: 'id', type: 'uuid', required: true, description: 'Fundraiser ID' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Fundraiser updated successfully',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated: Help Support Local Food Bank",
  "slug": "help-support-local-food-bank",
  "summary": "Updated description with more details...",
  "goal_amount": 7500,
  "status": "active",
  "updated_at": "2024-01-16T14:22:00Z"
}`
              },
              { status: '400', description: 'Validation errors' },
              { status: '401', description: 'Authentication required' },
              { status: '403', description: 'Permission denied - not the owner' },
              { status: '404', description: 'Fundraiser not found' }
            ]}
            examples={[
              {
                title: 'Update Fundraiser',
                code: `const { data, error } = await supabase
  .from('fundraisers')
  .update({
    title: 'Updated: Help Support Local Food Bank',
    summary: 'Updated description with more details...',
    goal_amount: 7500,  // Increased goal
    status: 'active'    // Publish the campaign
  })
  .eq('id', 'fundraiser-uuid')
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Statistics */}
        <SwaggerEndpoint
          method="POST"
          path="/rpc/get_fundraiser_totals"
          summary="Get fundraiser statistics"
          description="Retrieve statistics for multiple fundraisers at once"
          tags={['Statistics']}
        >
          <EndpointDetails
            requestBody={{
              contentType: 'application/json',
              example: `{
  "fundraiser_ids": [
    "fundraiser-uuid-1",
    "fundraiser-uuid-2",
    "fundraiser-uuid-3"
  ]
}`
            }}
            responses={[
              { 
                status: '200', 
                description: 'Array of statistics objects with total_raised and donor_count for each fundraiser',
                example: `[
  {
    "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000",
    "total_raised": 1250.50,
    "donor_count": 23
  },
  {
    "fundraiser_id": "456e7890-e89b-12d3-a456-426614174000", 
    "total_raised": 3780.25,
    "donor_count": 47
  },
  {
    "fundraiser_id": "789e0123-e89b-12d3-a456-426614174000",
    "total_raised": 850.00,
    "donor_count": 12
  }
]`
              }
            ]}
            examples={[
              {
                title: 'Get Statistics',
                code: `const { data, error } = await supabase
  .rpc('get_fundraiser_totals', {
    fundraiser_ids: [
      'fundraiser-uuid-1',
      'fundraiser-uuid-2', 
      'fundraiser-uuid-3'
    ]
  })

// Returns array with total_raised and donor_count for each fundraiser
console.log(data)`
              },
              {
                title: 'Using Service Layer',
                code: `import { fundraiserService } from '@/lib/services/fundraiser.service'

const stats = await fundraiserService.getFundraiserStats([
  'fundraiser-uuid-1',
  'fundraiser-uuid-2'
])

stats.forEach(stat => {
  console.log(\`\${stat.fundraiser_id}: $\${stat.total_raised} from \${stat.donor_count} donors\`)
})`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Common Use Cases" description="Practical examples for common fundraiser operations">
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Search Fundraisers</h4>
            <p className="text-sm text-muted-foreground mb-3">Search across titles and summaries</p>
            <CodeBlock 
              code={`const searchTerm = 'medical emergency'
const { data, error } = await supabase
  .from('fundraisers')
  .select('*')
  .or(\`title.ilike.%\${searchTerm}%,summary.ilike.%\${searchTerm}%\`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .limit(20)`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Filter by Category</h4>
            <p className="text-sm text-muted-foreground mb-3">Get fundraisers in specific categories</p>
            <CodeBlock 
              code={`// Get medical fundraisers
const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    categories!inner(name, emoji)
  \`)
  .eq('categories.name', 'Medical')
  .eq('status', 'active')
  .order('created_at', { ascending: false })`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Get User's Fundraisers</h4>
            <p className="text-sm text-muted-foreground mb-3">List all fundraisers created by a specific user</p>
            <CodeBlock 
              code={`// Get current user's fundraisers (requires auth)
const { data: { user } } = await supabase.auth.getUser()

const { data, error } = await supabase
  .from('fundraisers')
  .select('*')
  .eq('owner_user_id', user.id)
  .order('created_at', { ascending: false })`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Get Fundraiser with Statistics</h4>
            <p className="text-sm text-muted-foreground mb-3">Retrieve a fundraiser with calculated total raised and donor count</p>
            <CodeBlock 
              code={`// Get fundraiser with live statistics
const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .eq('slug', 'help-local-food-bank')
  .single()

// Then get statistics separately
const { data: stats } = await supabase
  .rpc('get_fundraiser_totals', {
    fundraiser_ids: [data.id]
  })`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Filter by Location and Goal Amount</h4>
            <p className="text-sm text-muted-foreground mb-3">Advanced filtering with multiple criteria</p>
            <CodeBlock 
              code={`// Find fundraisers in Texas with goals between $1,000-$10,000
const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .ilike('location', '%TX%')
  .gte('goal_amount', 1000)
  .lte('goal_amount', 10000)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}