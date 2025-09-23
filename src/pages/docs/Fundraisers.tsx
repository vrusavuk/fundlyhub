/**
 * API Documentation Fundraisers page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

      <h2 className="text-2xl font-bold mb-6">Endpoints</h2>

      <div className="space-y-8">
        {/* List Fundraisers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">GET</Badge>
              <code className="text-lg">/fundraisers</code>
            </div>
            <CardTitle className="text-xl">List Fundraisers</CardTitle>
            <CardDescription>Retrieve a paginated list of active public fundraisers with optional filtering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Query Parameters:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><code>status</code> - Filter by fundraiser status</div>
                <div><code>category_id</code> - Filter by category UUID</div>
                <div><code>limit</code> - Number of results (max 100)</div>
                <div><code>offset</code> - Pagination offset</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example Request:</h4>
              <CodeBlock 
                code={`const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })
  .range(0, 19)`}
                language="javascript"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Using the Service Layer:</h4>
              <CodeBlock 
                code={`import { fundraiserService } from '@/lib/services/fundraiser.service'

// Get fundraisers with automatic caching
const result = await fundraiserService.getFundraisers({
  status: 'active',
  category: 'medical',
  limit: 20,
  offset: 0
})

console.log('Fundraisers:', result.data)
console.log('Total count:', result.count)`}
                language="javascript"
              />
            </div>
          </CardContent>
        </Card>

        {/* Get Single Fundraiser */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">GET</Badge>
              <code className="text-lg">/fundraisers/{`{slug}`}</code>
            </div>
            <CardTitle className="text-xl">Get Fundraiser Details</CardTitle>
            <CardDescription>Retrieve detailed information about a specific fundraiser by slug</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Example Request:</h4>
              <CodeBlock 
                code={`const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar, bio),
    categories(name, emoji, color_class)
  \`)
  .eq('slug', 'help-local-food-bank')
  .eq('visibility', 'public')
  .single()`}
                language="javascript"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">With Statistics:</h4>
              <CodeBlock 
                code={`import { fundraiserService } from '@/lib/services/fundraiser.service'

// Get fundraiser with stats (total raised, donor count, days left)
const fundraiser = await fundraiserService.getFundraiserBySlug('help-local-food-bank')

console.log('Goal:', fundraiser.goal_amount)
console.log('Raised:', fundraiser.total_raised)
console.log('Donors:', fundraiser.donor_count)
console.log('Days left:', fundraiser.days_left)`}
                language="javascript"
              />
            </div>
          </CardContent>
        </Card>

        {/* Create Fundraiser */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-lg">/fundraisers</code>
              <Badge variant="outline">Auth Required</Badge>
            </div>
            <CardTitle className="text-xl">Create Fundraiser</CardTitle>
            <CardDescription>Create a new fundraising campaign (requires authentication)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Required Fields:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><code>title</code> - Campaign title (3-100 chars)</div>
                <div><code>goal_amount</code> - Target amount (number)</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Optional Fields:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><code>summary</code> - Brief description</div>
                <div><code>story_html</code> - Full story content</div>
                <div><code>category_id</code> - Category UUID</div>
                <div><code>cover_image</code> - Main image URL</div>
                <div><code>end_date</code> - Campaign end date</div>
                <div><code>location</code> - Geographic location</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example Request:</h4>
              <CodeBlock 
                code={`const { data, error } = await supabase
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
  .select()`}
                language="javascript"
              />
            </div>
          </CardContent>
        </Card>

        {/* Update Fundraiser */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-500 hover:bg-orange-600">PUT</Badge>
              <code className="text-lg">/fundraisers/{`{id}`}</code>
              <Badge variant="outline">Owner Only</Badge>
            </div>
            <CardTitle className="text-xl">Update Fundraiser</CardTitle>
            <CardDescription>Update fundraiser details (only by owner or organization admins)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Example Request:</h4>
              <CodeBlock 
                code={`const { data, error } = await supabase
  .from('fundraisers')
  .update({
    title: 'Updated: Help Support Local Food Bank',
    summary: 'Updated description with more details...',
    goal_amount: 7500,  // Increased goal
    status: 'active'    // Publish the campaign
  })
  .eq('id', 'fundraiser-uuid')
  .select()`}
                language="javascript"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Status Updates:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <Badge variant="outline">draft</Badge>
                <Badge variant="default">active</Badge>
                <Badge variant="secondary">paused</Badge>
                <Badge variant="destructive">ended</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Fundraiser Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">POST</Badge>
              <code className="text-lg">/rpc/get_fundraiser_totals</code>
            </div>
            <CardTitle className="text-xl">Get Fundraiser Statistics</CardTitle>
            <CardDescription>Retrieve statistics for multiple fundraisers at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Example Request:</h4>
              <CodeBlock 
                code={`const { data, error } = await supabase
  .rpc('get_fundraiser_totals', {
    fundraiser_ids: [
      'fundraiser-uuid-1',
      'fundraiser-uuid-2', 
      'fundraiser-uuid-3'
    ]
  })

// Returns array with total_raised and donor_count for each fundraiser
console.log(data)`}
                language="javascript"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Using the Service Layer:</h4>
              <CodeBlock 
                code={`import { fundraiserService } from '@/lib/services/fundraiser.service'

const stats = await fundraiserService.getFundraiserStats([
  'fundraiser-uuid-1',
  'fundraiser-uuid-2'
])

stats.forEach(stat => {
  console.log(\`\${stat.fundraiser_id}: $\${stat.total_raised} from \${stat.donor_count} donors\`)
})`}
                language="javascript"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-12">Common Use Cases</h2>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Fundraisers</CardTitle>
            <CardDescription>Search across titles and summaries</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter by Category</CardTitle>
            <CardDescription>Get fundraisers in specific categories</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get User's Fundraisers</CardTitle>
            <CardDescription>List all fundraisers created by a specific user</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}