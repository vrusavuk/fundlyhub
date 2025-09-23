/**
 * Interactive API Explorer page
 */
import { useState } from "react";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Play, Copy, Settings } from "lucide-react";

export function DocsApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('fundraisers-list');
  const [requestData, setRequestData] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');

  const endpoints = {
    'fundraisers-list': {
      method: 'GET',
      path: '/fundraisers',
      description: 'List active public fundraisers',
      parameters: [
        { name: 'status', type: 'string', description: 'Filter by status' },
        { name: 'category_id', type: 'uuid', description: 'Filter by category' },
        { name: 'limit', type: 'number', description: 'Number of results' }
      ]
    },
    'fundraisers-get': {
      method: 'GET',
      path: '/fundraisers/{id}',
      description: 'Get fundraiser details',
      parameters: [
        { name: 'id', type: 'uuid', required: true, description: 'Fundraiser ID' }
      ]
    },
    'fundraisers-create': {
      method: 'POST',
      path: '/fundraisers',
      description: 'Create new fundraiser',
      requiresAuth: true,
      body: {
        title: 'string',
        summary: 'string',
        goal_amount: 'number',
        category_id: 'uuid'
      }
    },
    'categories-list': {
      method: 'GET',
      path: '/categories',
      description: 'List all categories'
    },
    'donations-create': {
      method: 'POST',
      path: '/donations',
      description: 'Create a donation',
      body: {
        fundraiser_id: 'uuid',
        amount: 'number',
        tip_amount: 'number'
      }
    }
  };

  const currentEndpoint = endpoints[selectedEndpoint];

  const generateCurl = () => {
    const endpoint = endpoints[selectedEndpoint];
    let curl = `curl -X ${endpoint.method} "$SUPABASE_URL/rest/v1${endpoint.path}"`;
    curl += ` \\\n  -H "apikey: $SUPABASE_ANON_KEY"`;
    
    if (endpoint.requiresAuth) {
      curl += ` \\\n  -H "Authorization: Bearer $SUPABASE_JWT_TOKEN"`;
    }
    
    if (endpoint.method === 'POST' || endpoint.method === 'PATCH') {
      curl += ` \\\n  -H "Content-Type: application/json"`;
      curl += ` \\\n  -H "Prefer: return=representation"`;
    }
    
    if (requestData.trim()) {
      curl += ` \\\n  -d '${requestData}'`;
    }
    
    return curl;
  };

  const generateJavaScript = () => {
    const endpoint = endpoints[selectedEndpoint];
    let js = `// Using Supabase JavaScript client\nimport { supabase } from './supabase'\n\n`;
    
    if (selectedEndpoint === 'fundraisers-list') {
      js += `const { data, error } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles(name, avatar),
    categories(name, emoji)
  \`)
  .eq('status', 'active')
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })`;
    } else if (selectedEndpoint === 'fundraisers-create') {
      js += `const { data, error } = await supabase
  .from('fundraisers')
  .insert([${requestData || '{\n    title: "My Fundraiser",\n    goal_amount: 1000\n  }'}])
  .select()`;
    } else if (selectedEndpoint === 'categories-list') {
      js += `const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order')`;
    } else if (selectedEndpoint === 'donations-create') {
      js += `const { data, error } = await supabase
  .from('donations')
  .insert([${requestData || '{\n    fundraiser_id: "uuid-here",\n    amount: 50.00\n  }'}])
  .select()`;
    }
    
    js += `\n\nif (error) {
  console.error('Error:', error)
} else {
  console.log('Success:', data)
}`;
    
    return js;
  };

  const handleTryIt = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      // Simulate API call - in a real implementation, this would make actual requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let mockResponse;
      if (selectedEndpoint === 'fundraisers-list') {
        mockResponse = {
          data: [
            {
              id: "123e4567-e89b-12d3-a456-426614174000",
              title: "Help Local Food Bank",
              summary: "Supporting families in need",
              goal_amount: 5000,
              status: "active",
              profiles: { name: "John Doe", avatar: null },
              categories: { name: "Community", emoji: "🏘️" }
            }
          ]
        };
      } else if (selectedEndpoint === 'categories-list') {
        mockResponse = {
          data: [
            { id: "cat1", name: "Medical", emoji: "🏥", is_active: true },
            { id: "cat2", name: "Education", emoji: "📚", is_active: true }
          ]
        };
      } else {
        mockResponse = { success: true, message: "Operation completed successfully" };
      }
      
      setResponse(JSON.stringify(mockResponse, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">Interactive API Explorer</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Test API endpoints interactively and generate code examples for your integration.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a demo interface. In a production environment, you would connect this to your actual Supabase project.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Select an endpoint and configure your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundraisers-list">GET /fundraisers - List fundraisers</SelectItem>
                    <SelectItem value="fundraisers-get">GET /fundraisers/&#123;id&#125; - Get fundraiser</SelectItem>
                    <SelectItem value="fundraisers-create">POST /fundraisers - Create fundraiser</SelectItem>
                    <SelectItem value="categories-list">GET /categories - List categories</SelectItem>
                    <SelectItem value="donations-create">POST /donations - Create donation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${
                  currentEndpoint.method === 'GET' ? 'bg-blue-500' :
                  currentEndpoint.method === 'POST' ? 'bg-green-500' :
                  'bg-orange-500'
                }`}>
                  {currentEndpoint.method}
                </Badge>
                <code className="text-sm">{currentEndpoint.path}</code>
              </div>

              <p className="text-sm text-muted-foreground">
                {currentEndpoint.description}
              </p>

              {currentEndpoint.requiresAuth && (
                <div>
                  <Label htmlFor="auth-token">JWT Token (Required)</Label>
                  <Input
                    id="auth-token"
                    type="password"
                    placeholder="Enter your JWT token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                </div>
              )}

              {currentEndpoint.parameters && (
                <div>
                  <Label>Parameters</Label>
                  <div className="space-y-2 mt-2">
                    {currentEndpoint.parameters.map((param, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <code className="text-primary">{param.name}</code>
                          <Badge variant="outline" className="text-xs">{param.type}</Badge>
                          {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        <p className="text-muted-foreground mt-1">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentEndpoint.body && (
                <div>
                  <Label htmlFor="request-body">Request Body (JSON)</Label>
                  <Textarea
                    id="request-body"
                    placeholder="Enter JSON request body"
                    value={requestData}
                    onChange={(e) => setRequestData(e.target.value)}
                    rows={6}
                  />
                </div>
              )}

              <Button onClick={handleTryIt} disabled={loading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Making Request...' : 'Try It Out'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Code Examples and Response */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Code</CardTitle>
              <CardDescription>
                Copy these examples to integrate with your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="javascript" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-2 z-10"
                      onClick={() => copyToClipboard(generateJavaScript())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CodeBlock code={generateJavaScript()} language="javascript" />
                  </div>
                </TabsContent>
                
                <TabsContent value="curl" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-2 z-10"
                      onClick={() => copyToClipboard(generateCurl())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CodeBlock code={generateCurl()} language="bash" />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
                <CardDescription>
                  API response from your request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => copyToClipboard(response)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <CodeBlock code={response} language="json" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Set up your environment</h4>
            <CodeBlock 
              code={`# Install Supabase client
npm install @supabase/supabase-js

# Set environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Initialize Supabase client</h4>
            <CodeBlock 
              code={`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Make your first request</h4>
            <CodeBlock 
              code={`// Get active fundraisers
const { data, error } = await supabase
  .from('fundraisers')
  .select('*')
  .eq('status', 'active')
  .eq('visibility', 'public')

console.log('Fundraisers:', data)`}
              language="javascript"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );    
}