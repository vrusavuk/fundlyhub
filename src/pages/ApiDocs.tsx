/**
 * API Documentation page in Swagger documentation format
 */
import { AppLayout } from "@/components/layout/AppLayout";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerUI } from "@/components/docs/SwaggerUI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

const ApiDocs = () => {
  return (
    <AppLayout fullWidth>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <DocsSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          <main className="flex-1 max-w-4xl mx-auto p-8">
            {/* Overview */}
            <section id="overview" className="mb-12">
              <h1 className="text-4xl font-bold mb-4">FundlyHub API Documentation</h1>
              <p className="text-xl text-muted-foreground mb-6">
                The FundlyHub API provides programmatic access to all platform functionality including fundraisers, 
                user profiles, donations, and search capabilities.
              </p>
              
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This is a RESTful API built on Supabase with automatic caching, retry logic, and comprehensive error handling.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Base URL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1
                    </code>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="default">v1.0.0</Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">JSON</Badge>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
              <p className="text-muted-foreground mb-6">
                Get started with the FundlyHub API in just a few steps.
              </p>

              <h3 className="text-xl font-semibold mb-4">Installation</h3>
              <p className="mb-4">Install the Supabase JavaScript client:</p>
              <CodeBlock 
                code="npm install @supabase/supabase-js"
                language="bash"
                title="npm"
              />

              <h3 className="text-xl font-semibold mb-4 mt-8">Initialize Client</h3>
              <CodeBlock 
                code={`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sgcaqrtnxqhrrqzxmupa.supabase.co',
  'your-anon-key'
)`}
                language="javascript"
                title="Initialize Supabase client"
              />

              <h3 className="text-xl font-semibold mb-4 mt-8">Your First Request</h3>
              <CodeBlock 
                code={`// Get active fundraisers
const { data, error } = await supabase
  .from('fundraisers')
  .select('*')
  .eq('status', 'active')
  .eq('visibility', 'public')
  .limit(10)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Fundraisers:', data)
}`}
                language="javascript"
                title="Fetch fundraisers"
              />
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-6">
                The FundlyHub API uses Supabase JWT tokens for authentication with Row Level Security (RLS) policies.
              </p>

              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some endpoints require authentication while others are publicly accessible. 
                  Check each endpoint's documentation for specific requirements.
                </AlertDescription>
              </Alert>

              <h3 id="jwt-tokens" className="text-xl font-semibold mb-4">JWT Tokens</h3>
              <p className="mb-4">Include the JWT token in the Authorization header:</p>
              <CodeBlock 
                code={`// Authenticate user first
const { data: { user }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Token is automatically included in subsequent requests
const { data, error } = await supabase
  .from('fundraisers')
  .insert([{ title: 'My Campaign', goal_amount: 1000 }])`}
                language="javascript"
                title="Authentication example"
              />

              <h3 id="api-keys" className="text-xl font-semibold mb-4 mt-8">API Keys</h3>
              <p className="mb-4">For server-side requests, include the API key:</p>
              <CodeBlock 
                code={`curl -X GET "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                language="bash"
                title="cURL with API key"
              />
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Rate Limits & Caching</h2>
              <p className="text-muted-foreground mb-6">
                The API includes automatic caching and retry logic for improved performance and reliability.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Caching</CardTitle>
                    <CardDescription>Automatic response caching</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cache TTL:</span>
                      <Badge variant="outline">5 minutes</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Strategy:</span>
                      <Badge variant="outline">In-memory</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Retry Logic</CardTitle>
                    <CardDescription>Automatic retry on failures</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Max Retries:</span>
                      <Badge variant="outline">3 attempts</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Backoff:</span>
                      <Badge variant="outline">Exponential</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* API Reference */}
            <section id="fundraisers" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Fundraisers API</h2>
              <p className="text-muted-foreground mb-6">
                Manage fundraising campaigns with full CRUD operations.
              </p>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">GET</Badge>
                      <code>/fundraisers</code>
                    </div>
                    <CardDescription>List all active public fundraisers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar)
  \`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })
  .limit(20)`}
                      language="javascript"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">POST</Badge>
                      <code>/fundraisers</code>
                      <Badge variant="outline">Auth Required</Badge>
                    </div>
                    <CardDescription>Create a new fundraiser</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`const { data, error } = await supabase
  .from('fundraisers')
  .insert([{
    title: 'Help Support Local Food Bank',
    summary: 'Raising funds for our community food bank',
    goal_amount: 5000,
    currency: 'USD',
    category_id: 'uuid-here'
  }])
  .select()`}
                      language="javascript"
                    />
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Categories API */}
            <section id="categories" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Categories API</h2>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">GET</Badge>
                    <code>/categories</code>
                  </div>
                  <CardDescription>Get all active categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock 
                    code={`const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order')`}
                    language="javascript"
                  />
                </CardContent>
              </Card>
            </section>

            {/* JavaScript Examples */}
            <section id="javascript-examples" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">JavaScript Examples</h2>
              <p className="text-muted-foreground mb-6">
                Complete examples using the Supabase JavaScript client.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Search Fundraisers</h3>
                  <CodeBlock 
                    code={`// Search fundraisers by title and summary
const searchTerm = 'medical';
const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar)
  \`)
  .or(\`title.ilike.%\${searchTerm}%,summary.ilike.%\${searchTerm}%\`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .limit(10)`}
                    language="javascript"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Create Donation</h3>
                  <CodeBlock 
                    code={`// Create a new donation
const { data, error } = await supabase
  .from('donations')
  .insert([{
    fundraiser_id: 'fundraiser-uuid',
    amount: 25.00,
    currency: 'USD',
    payment_status: 'paid'
  }])
  .select()`}
                    language="javascript"
                  />
                </div>
              </div>
            </section>

            {/* cURL Examples */}
            <section id="curl-examples" className="mb-12">
              <h2 className="text-3xl font-bold mb-4">cURL Examples</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">List Fundraisers</h3>
                  <CodeBlock 
                    code={`curl -X GET "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers?status=eq.active&visibility=eq.public&select=*" \\
  -H "apikey: YOUR_API_KEY"`}
                    language="bash"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Create Fundraiser</h3>
                  <CodeBlock 
                    code={`curl -X POST "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Help Local Food Bank",
    "summary": "Supporting our community",
    "goal_amount": 5000,
    "currency": "USD"
  }'`}
                    language="bash"
                  />
                </div>
              </div>
            </section>

            {/* Interactive API Explorer */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Interactive API Explorer</h2>
              <p className="text-muted-foreground mb-6">
                Test API endpoints directly in your browser with live examples.
              </p>
              
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  The interactive explorer below allows you to test all API endpoints with real data.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-0">
                  <SwaggerUI />
                </CardContent>
              </Card>
            </section>
          </main>
          
          {/* Table of Contents */}
          <TableOfContents />
        </div>
      </div>
    </AppLayout>
  );
};

export default ApiDocs;