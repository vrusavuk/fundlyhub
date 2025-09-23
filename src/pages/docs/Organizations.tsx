/**
 * API Documentation Organizations page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsOrganizations() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Organizations API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Manage nonprofit organizations, verification status, and organizational fundraising.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Organization management requires authentication. Only organization members with admin/owner roles can update organization details.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Organization Management" 
        description="CRUD operations for nonprofit organizations with verification and member management."
      >
        {/* List Organizations */}
        <SwaggerEndpoint
          method="GET"
          path="/organizations"
          summary="List organizations"
          description="Retrieve all verified nonprofit organizations"
          tags={['Organizations']}
        >
          <EndpointDetails
            parameters={[
              { name: 'limit', type: 'integer', description: 'Number of results (max 100)', example: '20' },
              { name: 'offset', type: 'integer', description: 'Pagination offset', example: '0' },
              { name: 'verification_status', type: 'string', description: 'Filter by verification status', example: 'verified' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of organization objects',
                example: `[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "legal_name": "Austin Community Food Bank",
    "dba_name": "Food Bank Austin",
    "ein": "74-1234567",
    "website": "https://austinfoodbank.org",
    "verification_status": "verified",
    "categories": ["hunger", "community"],
    "address": {
      "street": "2215 Rimrock Trail",
      "city": "Austin",
      "state": "TX",
      "zip": "78754",
      "country": "US"
    },
    "country": "US",
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2024-01-10T14:22:00Z"
  }
]`
              },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get Verified Organizations',
                code: `const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('verification_status', 'verified')
  .order('legal_name')`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Single Organization */}
        <SwaggerEndpoint
          method="GET"
          path="/organizations/{id}"
          summary="Get organization details"
          description="Retrieve detailed information about a specific organization"
          tags={['Organizations']}
        >
          <EndpointDetails
            parameters={[
              { name: 'id', type: 'uuid', required: true, description: 'Organization ID' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Organization object with detailed information',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "legal_name": "Austin Community Food Bank",
  "dba_name": "Food Bank Austin",
  "ein": "74-1234567",
  "website": "https://austinfoodbank.org",
  "verification_status": "verified",
  "categories": ["hunger", "community"],
  "address": {
    "street": "2215 Rimrock Trail",
    "city": "Austin",
    "state": "TX",
    "zip": "78754",
    "country": "US"
  },
  "country": "US",
  "stripe_connect_id": "acct_1234567890",
  "paypal_merchant_id": "MERCHANT123",
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2024-01-10T14:22:00Z"
}`
              },
              { status: '404', description: 'Organization not found' },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get Organization by ID',
                code: `const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', organizationId)
  .single()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Create Organization */}
        <SwaggerEndpoint
          method="POST"
          path="/organizations"
          summary="Create organization" 
          description="Register a new nonprofit organization (requires authentication)"
          tags={['Organizations']}
          requiresAuth={true}
        >
          <EndpointDetails
            requestBody={{
              contentType: 'application/json',
              example: `{
  "legal_name": "Austin Community Food Bank",
  "dba_name": "Food Bank Austin", 
  "ein": "74-1234567",
  "website": "https://austinfoodbank.org",
  "categories": ["hunger", "community"],
  "address": {
    "street": "2215 Rimrock Trail",
    "city": "Austin", 
    "state": "TX",
    "zip": "78754",
    "country": "US"
  },
  "country": "US"
}`
            }}
            responses={[
              { 
                status: '201', 
                description: 'Organization created successfully',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "legal_name": "Austin Community Food Bank",
  "verification_status": "pending",
  "created_at": "2024-01-16T10:30:00Z"
}`
              },
              { status: '400', description: 'Validation errors' },
              { status: '401', description: 'Authentication required' }
            ]}
            examples={[
              {
                title: 'Create Organization',
                code: `const { data, error } = await supabase
  .from('organizations')
  .insert([{
    legal_name: 'Austin Community Food Bank',
    dba_name: 'Food Bank Austin',
    ein: '74-1234567',
    website: 'https://austinfoodbank.org',
    categories: ['hunger', 'community'],
    address: {
      street: '2215 Rimrock Trail',
      city: 'Austin',
      state: 'TX', 
      zip: '78754',
      country: 'US'
    },
    country: 'US'
  }])
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Update Organization */}
        <SwaggerEndpoint
          method="PUT"
          path="/organizations/{id}"
          summary="Update organization"
          description="Update organization details (admin/owner only)"
          tags={['Organizations']}
          requiresAuth={true}
        >
          <EndpointDetails
            parameters={[
              { name: 'id', type: 'uuid', required: true, description: 'Organization ID' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Organization updated successfully',
                example: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "legal_name": "Austin Community Food Bank",
  "website": "https://newfoodbank.org",
  "updated_at": "2024-01-16T14:30:00Z"
}`
              },
              { status: '400', description: 'Validation errors' },
              { status: '401', description: 'Authentication required' },
              { status: '403', description: 'Permission denied - admin/owner only' },
              { status: '404', description: 'Organization not found' }
            ]}
            examples={[
              {
                title: 'Update Organization',
                code: `const { data, error } = await supabase
  .from('organizations')
  .update({
    website: 'https://newfoodbank.org',
    categories: ['hunger', 'community', 'education']
  })
  .eq('id', organizationId)
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Organization Members */}
        <SwaggerEndpoint
          method="GET"
          path="/org_members"
          summary="Get organization members"
          description="Retrieve members of organizations with their roles"
          tags={['Members']}
        >
          <EndpointDetails
            parameters={[
              { name: 'org_id', type: 'uuid', description: 'Filter by organization ID' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of organization member objects',
                example: `[
  {
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "456e7890-e89b-12d3-a456-426614174000",
    "role": "admin",
    "created_at": "2023-06-15T10:30:00Z"
  },
  {
    "org_id": "123e4567-e89b-12d3-a456-426614174000", 
    "user_id": "789e0123-e89b-12d3-a456-426614174000",
    "role": "editor",
    "created_at": "2023-08-22T14:15:00Z"
  }
]`
              }
            ]}
            examples={[
              {
                title: 'Get Organization Members',
                code: `const { data, error } = await supabase
  .from('org_members')
  .select('*')
  .eq('org_id', organizationId)`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Common Use Cases" description="Practical examples for working with organizations">
        <div className="grid gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Find Organizations by Category</h4>
            <p className="text-sm text-muted-foreground mb-3">Search for organizations working in specific areas</p>
            <CodeBlock 
              code={`// Find hunger relief organizations
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .contains('categories', ['hunger'])
  .eq('verification_status', 'verified')`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Organization with Fundraiser Count</h4>
            <p className="text-sm text-muted-foreground mb-3">Get organizations with their active campaign statistics</p>
            <CodeBlock 
              code={`// Get organization with fundraiser count
const { data, error } = await supabase
  .from('organizations')
  .select(\`
    *,
    fundraisers(count)
  \`)
  .eq('fundraisers.status', 'active')
  .eq('id', organizationId)`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}