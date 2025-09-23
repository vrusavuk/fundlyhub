/**
 * API Documentation Authentication page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Key } from "lucide-react";

export function DocsAuthentication() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Authentication</h1>
      <p className="text-xl text-muted-foreground mb-6">
        The FundlyHub API uses Supabase JWT tokens for authentication with Row Level Security (RLS) policies.
      </p>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Some endpoints require authentication while others are publicly accessible. 
          Check each endpoint's documentation for specific requirements.
        </AlertDescription>
      </Alert>

      <h2 className="text-2xl font-bold mb-4">Authentication Methods</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>API Key</CardTitle>
            </div>
            <CardDescription>For public, read-only access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Include the anon key in the apikey header for public endpoints.
            </p>
            <Badge variant="outline">Public Access</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle>JWT Token</CardTitle>
            </div>
            <CardDescription>For authenticated user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Include JWT token in Authorization header for protected endpoints.
            </p>
            <Badge variant="default">Authenticated Access</Badge>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Getting Started with Authentication</h2>
      
      <h3 className="text-xl font-semibold mb-4">1. Sign Up a New User</h3>
      <CodeBlock 
        code={`const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      name: 'John Doe'
    }
  }
})

if (error) {
  console.error('Sign up error:', error.message)
} else {
  console.log('User created:', data.user)
}`}
        language="javascript"
        title="User registration"
      />

      <h3 className="text-xl font-semibold mb-4 mt-8">2. Sign In Existing User</h3>
      <CodeBlock 
        code={`const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

if (error) {
  console.error('Sign in error:', error.message)
} else {
  console.log('User signed in:', data.user)
  // JWT token is automatically stored and included in subsequent requests
}`}
        language="javascript"
        title="User login"
      />

      <h3 className="text-xl font-semibold mb-4 mt-8">3. Making Authenticated Requests</h3>
      <p className="text-muted-foreground mb-4">
        Once authenticated, the JWT token is automatically included in requests:
      </p>
      <CodeBlock 
        code={`// Create a fundraiser (requires authentication)
const { data, error } = await supabase
  .from('fundraisers')
  .insert([{
    title: 'Help Local Food Bank',
    summary: 'Supporting our community during tough times',
    goal_amount: 5000,
    currency: 'USD'
  }])
  .select()

if (error) {
  console.error('Error creating fundraiser:', error)
} else {
  console.log('Fundraiser created:', data[0])
}`}
        language="javascript"
        title="Creating authenticated content"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">Manual Token Management</h2>
      <p className="text-muted-foreground mb-4">
        For server-side applications or custom implementations:
      </p>

      <h3 className="text-xl font-semibold mb-4">Getting the Current Session</h3>
      <CodeBlock 
        code={`const { data: { session }, error } = await supabase.auth.getSession()

if (session) {
  console.log('Access token:', session.access_token)
  console.log('Refresh token:', session.refresh_token)
} else {
  console.log('No active session')
}`}
        language="javascript"
        title="Session management"
      />

      <h3 className="text-xl font-semibold mb-4 mt-8">Using Tokens with HTTP Requests</h3>
      <CodeBlock 
        code={`// Using fetch with manual token
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const response = await fetch(
    'https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers',
    {
      headers: {
        'apikey': 'your-anon-key',
        'Authorization': \`Bearer \${session.access_token}\`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  const data = await response.json()
  console.log(data)
}`}
        language="javascript"
        title="Manual token usage"
      />

      <h3 className="text-xl font-semibold mb-4 mt-8">cURL Example</h3>
      <CodeBlock 
        code={`# Get user's own fundraisers
curl -X GET "https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1/fundraisers?owner_user_id=eq.user-uuid" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
        language="bash"
        title="cURL with authentication"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">Row Level Security (RLS)</h2>
      <p className="text-muted-foreground mb-4">
        FundlyHub uses Supabase's Row Level Security to control data access at the database level:
      </p>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public Data</CardTitle>
            <CardDescription>Accessible without authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>• Active public fundraisers</li>
              <li>• Categories and public statistics</li>
              <li>• Public user profiles</li>
              <li>• Comments on public fundraisers</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User-Specific Data</CardTitle>
            <CardDescription>Requires authentication, users can only access their own data</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>• Draft fundraisers</li>
              <li>• Donation records (donors and recipients)</li>
              <li>• Profile management</li>
              <li>• Activity feeds</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Sign Out</h2>
      <CodeBlock 
        code={`const { error } = await supabase.auth.signOut()

if (error) {
  console.error('Sign out error:', error.message)
} else {
  console.log('User signed out successfully')
  // JWT token is automatically cleared
}`}
        language="javascript"
        title="User logout"
      />
    </div>
  );
}