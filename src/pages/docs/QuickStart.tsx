/**
 * API Documentation Quick Start page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

export function DocsQuickStart() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Get started with the FundlyHub API in just a few steps.
      </p>

      <Alert className="mb-8">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          This guide will have you making your first API call in under 5 minutes.
        </AlertDescription>
      </Alert>

      <h2 className="text-2xl font-bold mb-4">1. Installation</h2>
      <p className="text-muted-foreground mb-4">Install the Supabase JavaScript client:</p>
      <CodeBlock 
        code="npm install @supabase/supabase-js"
        language="bash"
        title="npm"
      />

      <div className="mt-6 mb-8">
        <p className="text-muted-foreground mb-4">Or using yarn:</p>
        <CodeBlock 
          code="yarn add @supabase/supabase-js"
          language="bash"
          title="yarn"
        />
      </div>

      <h2 className="text-2xl font-bold mb-4">2. Initialize Client</h2>
      <p className="text-muted-foreground mb-4">
        Create a Supabase client instance with your project URL and API key:
      </p>
      <CodeBlock 
        code={`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sgcaqrtnxqhrrqzxmupa.supabase.co',
  'your-anon-key'
)

export default supabase`}
        language="javascript"
        title="supabase.js"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">3. Your First Request</h2>
      <p className="text-muted-foreground mb-4">
        Let's fetch some active fundraisers to test our connection:
      </p>
      <CodeBlock 
        code={`import supabase from './supabase'

async function getFundraisers() {
  try {
    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('status', 'active')
      .eq('visibility', 'public')
      .limit(10)

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('Fundraisers:', data)
    return data
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Call the function
getFundraisers()`}
        language="javascript"
        title="Getting fundraisers"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">4. With Authentication</h2>
      <p className="text-muted-foreground mb-4">
        For protected endpoints, you'll need to authenticate first:
      </p>
      <CodeBlock 
        code={`// Sign in a user
const { data: { user }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

if (error) {
  console.error('Auth error:', error)
  return
}

// Now you can access protected endpoints
const { data: userFundraisers, error: fetchError } = await supabase
  .from('fundraisers')
  .select('*')
  .eq('owner_user_id', user.id)`}
        language="javascript"
        title="Authenticated requests"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">Next Steps</h2>
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="font-semibold mb-3">Now that you're set up, explore:</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Authentication:</strong> Learn about JWT tokens and Row Level Security</li>
          <li>• <strong>API Reference:</strong> Detailed documentation for all endpoints</li>
          <li>• <strong>Examples:</strong> More complex use cases and code samples</li>
          <li>• <strong>Interactive Explorer:</strong> Test endpoints directly in your browser</li>
        </ul>
      </div>
    </div>
  );
}