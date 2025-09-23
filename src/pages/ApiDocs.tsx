/**
 * API Documentation page with interactive OpenAPI explorer
 */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SwaggerUI } from "@/components/docs/SwaggerUI";
import { Book, Code, Key, Zap, ExternalLink, Shield, Clock, Database } from "lucide-react";

const ApiDocs = () => {
  return (
    <AppLayout>
      <PageContainer maxWidth="xl">
        <PageHeader 
          title="API Documentation"
          description="Complete reference for the FundlyHub API with interactive examples and authentication guides"
          showBreadcrumbs={false}
        />

        {/* Quick Start Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </div>
              <CardDescription>
                Get up and running with the FundlyHub API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-1">Base URL:</div>
                <div className="text-foreground break-all">
                  https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Book className="h-4 w-4 mr-2" />
                View Getting Started Guide
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Authentication</CardTitle>
              </div>
              <CardDescription>
                Secure API access with Supabase JWT tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="secondary">JWT Bearer Token</Badge>
                <Badge variant="outline">Row Level Security</Badge>
              </div>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                Authorization: Bearer YOUR_JWT_TOKEN
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Authentication Guide
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-success" />
                <CardTitle className="text-lg">Rate Limits</CardTitle>
              </div>
              <CardDescription>
                Built-in caching and retry logic for reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache TTL:</span>
                  <span className="font-mono">5 minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Retry Policy:</span>
                  <span className="font-mono">3 attempts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Results:</span>
                  <span className="font-mono">100 per page</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Performance Guide
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* API Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Features
            </CardTitle>
            <CardDescription>
              Comprehensive API covering all FundlyHub platform functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Badge variant="default">Fundraisers</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• List & filter campaigns</li>
                  <li>• Create & update fundraisers</li>
                  <li>• Get detailed statistics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">Categories</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Browse all categories</li>
                  <li>• Category statistics</li>
                  <li>• Campaign counts per category</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">User Profiles</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Public profile access</li>
                  <li>• Profile management</li>
                  <li>• User activity feeds</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Donations</Badge>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create donations</li>
                  <li>• Payment processing</li>
                  <li>• Transaction tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive API Explorer */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Interactive API Explorer</CardTitle>
                <CardDescription>
                  Test API endpoints directly in your browser with live examples
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <SwaggerUI className="border-t" />
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>
              Ready-to-use code snippets in multiple programming languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* JavaScript Example */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-4 w-4" />
                JavaScript / TypeScript
              </h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sgcaqrtnxqhrrqzxmupa.supabase.co',
  'your-anon-key'
)

// Get active fundraisers
const { data, error } = await supabase
  .from('fundraisers')
  .select('*')
  .eq('status', 'active')
  .eq('visibility', 'public')
  .limit(10)

// Create a new donation
const { data: donation, error } = await supabase
  .from('donations')
  .insert([{
    fundraiser_id: 'uuid-here',
    amount: 25.00,
    currency: 'USD'
  }])
  .select()`}</pre>
              </div>
            </div>

            {/* cURL Example */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-4 w-4" />
                cURL
              </h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`# Get fundraisers
curl -X GET "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers?status=eq.active&visibility=eq.public" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create donation
curl -X POST "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/donations" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fundraiser_id": "uuid-here",
    "amount": 25.00,
    "currency": "USD"
  }'`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
};

export default ApiDocs;