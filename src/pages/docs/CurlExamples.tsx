/**
 * cURL Examples page for API documentation
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Terminal, Key, Globe } from "lucide-react";

export function DocsCurlExamples() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">cURL Examples</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Command-line examples for testing and integrating with the FundlyHub API using cURL.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Replace <code>YOUR_PROJECT_URL</code> and <code>YOUR_ANON_KEY</code> with your actual Supabase project credentials. For authenticated requests, include the JWT token in the Authorization header.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Authentication Setup" 
        description="Basic configuration and authentication examples"
      >
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4" />
              <h4 className="font-semibold text-foreground">Environment Variables</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Set up your environment variables for easier testing</p>
            <CodeBlock 
              code={`# Set these environment variables in your terminal
export SUPABASE_URL="https://your-project-url.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
export SUPABASE_JWT_TOKEN="your-jwt-token-here"  # After authentication

# Or create a .env file and source it
echo 'SUPABASE_URL=https://your-project-url.supabase.co' > .env
echo 'SUPABASE_ANON_KEY=your-anon-key-here' >> .env
source .env`}
              language="bash"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4" />
              <h4 className="font-semibold text-foreground">User Authentication</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Sign up and sign in to get JWT tokens</p>
            <CodeBlock 
              code={`# Sign up a new user
curl -X POST "$SUPABASE_URL/auth/v1/signup" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "data": {
      "name": "John Doe"
    }
  }'

# Sign in existing user
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'

# Get current user info (requires JWT token)
curl -X GET "$SUPABASE_URL/auth/v1/user" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN"`}
              language="bash"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Fundraiser Operations" 
        description="Complete CRUD operations for fundraisers"
      >
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-blue-500">GET</Badge>
              <h4 className="font-semibold text-foreground">List Fundraisers</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Retrieve public fundraisers with filtering and pagination</p>
            <CodeBlock 
              code={`# Get all active fundraisers
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active&visibility=eq.public&select=*,profiles(name,avatar),categories(name,emoji)" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Get fundraisers with pagination
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active&limit=20&offset=0" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Range: 0-19"

# Search fundraisers by title or summary
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?or=(title.ilike.*medical*,summary.ilike.*medical*)&status=eq.active" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Filter by category
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?category_id=eq.123e4567-e89b-12d3-a456-426614174000&status=eq.active" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Filter by goal amount range
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?goal_amount=gte.1000&goal_amount=lte.10000&status=eq.active" \\
  -H "apikey: $SUPABASE_ANON_KEY"`}
              language="bash"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-blue-500">GET</Badge>
              <h4 className="font-semibold text-foreground">Get Single Fundraiser</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Retrieve detailed information about a specific fundraiser</p>
            <CodeBlock 
              code={`# Get fundraiser by ID
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?id=eq.123e4567-e89b-12d3-a456-426614174000&select=*,profiles(name,avatar,bio),categories(name,emoji,color_class)" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get fundraiser by slug
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?slug=eq.help-local-food-bank&select=*,profiles(name,avatar,bio),categories(name,emoji,color_class)" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get fundraiser statistics
curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_fundraiser_totals" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fundraiser_ids": ["123e4567-e89b-12d3-a456-426614174000"]
  }'`}
              language="bash"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-green-500">POST</Badge>
              <h4 className="font-semibold text-foreground">Create Fundraiser</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Create a new fundraising campaign (requires authentication)</p>
            <CodeBlock 
              code={`# Create a new fundraiser
curl -X POST "$SUPABASE_URL/rest/v1/fundraisers" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{
    "title": "Help Support Local Food Bank",
    "summary": "Raising funds to support families in need during the holiday season",
    "story_html": "<p>Our local food bank serves over 500 families in our community...</p>",
    "goal_amount": 5000,
    "currency": "USD",
    "category_id": "789e0123-e89b-12d3-a456-426614174000",
    "cover_image": "https://example.com/image.jpg",
    "location": "Austin, TX",
    "tags": ["community", "food", "families"],
    "end_date": "2024-12-31"
  }'`}
              language="bash"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-orange-500">PUT</Badge>
              <h4 className="font-semibold text-foreground">Update Fundraiser</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Update fundraiser details (owner only)</p>
            <CodeBlock 
              code={`# Update fundraiser
curl -X PATCH "$SUPABASE_URL/rest/v1/fundraisers?id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{
    "title": "Updated: Help Support Local Food Bank",
    "summary": "Updated description with more details about our mission",
    "goal_amount": 7500,
    "status": "active"
  }'

# Publish a draft fundraiser
curl -X PATCH "$SUPABASE_URL/rest/v1/fundraisers?id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "active"
  }'`}
              language="bash"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Categories & Organizations" 
        description="Working with categories and organizations"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Categories</h4>
            <p className="text-sm text-muted-foreground mb-3">Retrieve fundraising categories and statistics</p>
            <CodeBlock 
              code={`# Get all active categories
curl -X GET "$SUPABASE_URL/rest/v1/categories?is_active=eq.true&order=display_order" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get category statistics
curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_category_stats" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{}'`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Organizations</h4>
            <p className="text-sm text-muted-foreground mb-3">Work with nonprofit organizations</p>
            <CodeBlock 
              code={`# Get verified organizations
curl -X GET "$SUPABASE_URL/rest/v1/organizations?verification_status=eq.verified&order=legal_name" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get specific organization
curl -X GET "$SUPABASE_URL/rest/v1/organizations?id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Create organization (requires authentication)
curl -X POST "$SUPABASE_URL/rest/v1/organizations" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "legal_name": "Austin Community Food Bank",
    "dba_name": "Food Bank Austin",
    "ein": "74-1234567",
    "website": "https://austinfoodbank.org",
    "categories": ["hunger", "community"],
    "country": "US"
  }'`}
              language="bash"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Donations & Profiles" 
        description="Donation processing and user profile management"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Donations</h4>
            <p className="text-sm text-muted-foreground mb-3">Create and retrieve donation records</p>
            <CodeBlock 
              code={`# Create a donation
curl -X POST "$SUPABASE_URL/rest/v1/donations" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{
    "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 50.00,
    "tip_amount": 2.50,
    "currency": "USD",
    "payment_provider": "stripe",
    "payment_status": "paid",
    "receipt_id": "pi_1234567890"
  }'

# Get donations for a fundraiser (owner only)
curl -X GET "$SUPABASE_URL/rest/v1/donations?fundraiser_id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN"

# Get my donation history
curl -X GET "$SUPABASE_URL/rest/v1/donations?donor_user_id=eq.456e7890-e89b-12d3-a456-426614174000&select=*,fundraisers(title,slug)" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN"`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">User Profiles</h4>
            <p className="text-sm text-muted-foreground mb-3">Manage user profiles and social features</p>
            <CodeBlock 
              code={`# Get public profiles
curl -X GET "$SUPABASE_URL/rest/v1/profiles?limit=20&order=created_at.desc" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get specific user profile
curl -X GET "$SUPABASE_URL/rest/v1/profiles?id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Update my profile
curl -X PATCH "$SUPABASE_URL/rest/v1/profiles?id=eq.123e4567-e89b-12d3-a456-426614174000" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "bio": "Passionate about helping local communities",
    "location": "Austin, TX",
    "website": "https://johndoe.com"
  }'

# Follow a user
curl -X POST "$SUPABASE_URL/rest/v1/subscriptions" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "following_id": "456e7890-e89b-12d3-a456-426614174000",
    "following_type": "user"
  }'`}
              language="bash"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Advanced Operations" 
        description="Complex queries and batch operations"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Complex Filtering</h4>
            <p className="text-sm text-muted-foreground mb-3">Advanced filtering and search operations</p>
            <CodeBlock 
              code={`# Complex fundraiser search with multiple filters
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active&goal_amount=gte.1000&goal_amount=lte.10000&location=ilike.*Austin*&or=(title.ilike.*medical*,summary.ilike.*medical*)&select=*,profiles(name,avatar),categories(name,emoji)&order=created_at.desc&limit=20" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Get fundraisers with statistics in one request
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active&select=*,profiles(name,avatar),categories(name,emoji)" \\
  -H "apikey: $SUPABASE_ANON_KEY" | \\
jq '.[] | {id: .id, title: .title, goal_amount: .goal_amount}'`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Data Analysis</h4>
            <p className="text-sm text-muted-foreground mb-3">Generate reports and analytics</p>
            <CodeBlock 
              code={`# Get campaign performance summary
curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_campaign_stats" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{}'

# Export fundraiser data as CSV (using jq for processing)
curl -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active&select=id,title,goal_amount,created_at,profiles(name)" \\
  -H "apikey: $SUPABASE_ANON_KEY" | \\
jq -r '["ID","Title","Goal","Created","Owner"], (.[] | [.id, .title, .goal_amount, .created_at, .profiles.name]) | @csv'

# Get donation trends for a specific period
curl -X GET "$SUPABASE_URL/rest/v1/donations?created_at=gte.2024-01-01&created_at=lte.2024-01-31&select=amount,created_at,fundraiser_id" \\
  -H "apikey: $SUPABASE_ANON_KEY"`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Error Handling</h4>
            <p className="text-sm text-muted-foreground mb-3">Handle errors and debug API responses</p>
            <CodeBlock 
              code={`# Verbose output for debugging
curl -v -X GET "$SUPABASE_URL/rest/v1/fundraisers?status=eq.active" \\
  -H "apikey: $SUPABASE_ANON_KEY"

# Check HTTP status codes
curl -w "HTTP Status: %{http_code}\\n" -X GET "$SUPABASE_URL/rest/v1/fundraisers" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -o /dev/null -s

# Handle authentication errors
curl -X POST "$SUPABASE_URL/rest/v1/fundraisers" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Test"}' \\
  -w "\\nHTTP Status: %{http_code}\\n" \\
  -i

# Test with invalid JWT token
curl -X GET "$SUPABASE_URL/rest/v1/donations" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer invalid-token" \\
  -w "\\nHTTP Status: %{http_code}\\n"`}
              language="bash"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}