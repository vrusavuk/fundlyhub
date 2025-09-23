/**
 * API Documentation Rate Limits page
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Clock, Zap, Shield } from "lucide-react";

export function DocsRateLimits() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Rate Limits & Performance</h1>
      <p className="text-xl text-muted-foreground mb-6">
        The FundlyHub API includes automatic caching and retry logic for improved performance and reliability.
      </p>

      <Alert className="mb-8">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          Our API service layer automatically handles caching, retries, and error recovery to provide the best possible experience.
        </AlertDescription>
      </Alert>

      <h2 className="text-2xl font-bold mb-4">Caching Strategy</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Response Caching</CardTitle>
            </div>
            <CardDescription>Automatic in-memory caching for better performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Cache TTL:</span>
              <Badge variant="outline">5 minutes</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Strategy:</span>
              <Badge variant="outline">In-memory</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Scope:</span>
              <Badge variant="outline">Per query</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle>Retry Logic</CardTitle>
            </div>
            <CardDescription>Automatic retry on transient failures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Max Retries:</span>
              <Badge variant="outline">3 attempts</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Backoff:</span>
              <Badge variant="outline">Exponential</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Max Delay:</span>
              <Badge variant="outline">10 seconds</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">API Service Features</h2>
      <p className="text-muted-foreground mb-6">
        Our API service layer provides built-in performance optimizations:
      </p>

      <h3 className="text-xl font-semibold mb-4">Automatic Caching</h3>
      <p className="text-muted-foreground mb-4">
        The API service automatically caches responses to reduce load times:
      </p>
      <CodeBlock 
        code={`// Example: Using the fundraiser service with automatic caching
import { fundraiserService } from '@/lib/services/fundraiser.service'

// First call - fetches from database
const fundraisers1 = await fundraiserService.getFundraisers({
  status: 'active',
  limit: 20
})

// Second call within 5 minutes - returns cached result
const fundraisers2 = await fundraiserService.getFundraisers({
  status: 'active', 
  limit: 20
})

// Clear cache manually if needed
fundraiserService.clearCache('fundraisers*')`}
        language="javascript"
        title="Automatic caching in action"
      />

      <h3 className="text-xl font-semibold mb-4 mt-8">Retry Configuration</h3>
      <p className="text-muted-foreground mb-4">
        Configure retry behavior for your specific use case:
      </p>
      <CodeBlock 
        code={`import { apiService } from '@/lib/services/api.service'

// Custom retry configuration
const customRetryConfig = {
  maxRetries: 5,
  baseDelay: 2000,    // 2 seconds
  maxDelay: 30000,    // 30 seconds max
  exponentialBackoff: true
}

// Execute with custom retry logic
const result = await apiService.executeWithRetry(
  async () => {
    const { data, error } = await supabase
      .from('fundraisers')
      .select('*')
      .eq('status', 'active')
    
    if (error) throw error
    return data
  },
  customRetryConfig
)`}
        language="javascript"
        title="Custom retry configuration"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">Cache Management</h2>
      
      <h3 className="text-xl font-semibold mb-4">Cache Keys</h3>
      <p className="text-muted-foreground mb-4">
        Cache keys are automatically generated based on query parameters:
      </p>
      <div className="bg-muted p-4 rounded-lg mb-6">
        <div className="space-y-2 text-sm font-mono">
          <div><span className="text-muted-foreground">Fundraisers:</span> fundraisers:status=active:limit=20</div>
          <div><span className="text-muted-foreground">Categories:</span> categories:active=true</div>
          <div><span className="text-muted-foreground">Category Stats:</span> category-stats:all</div>
          <div><span className="text-muted-foreground">User Profile:</span> profile:user-uuid</div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Manual Cache Control</h3>
      <CodeBlock 
        code={`import { fundraiserService, categoryService } from '@/lib/services'

// Clear specific cache entries
fundraiserService.clearCache('fundraisers:status=active')

// Clear all fundraiser cache entries
fundraiserService.clearCache('fundraisers*')

// Clear all cache
fundraiserService.clearCache()

// Clear category cache
categoryService.clearCache('categories*')`}
        language="javascript"
        title="Manual cache clearing"
      />

      <h2 className="text-2xl font-bold mb-4 mt-8">Performance Best Practices</h2>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagination</CardTitle>
            <CardDescription>Use pagination for large datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={`// Good: Use pagination for large lists
const { data } = await supabase
  .from('fundraisers')
  .select('*')
  .range(0, 19)  // First 20 items
  .limit(20)

// Better: Use the service layer with built-in pagination
const result = await fundraiserService.getFundraisers({
  limit: 20,
  offset: 0
})`}
              language="javascript"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Only What You Need</CardTitle>
            <CardDescription>Reduce payload size by selecting specific columns</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={`// Good: Select only required fields
const { data } = await supabase
  .from('fundraisers')
  .select('id, title, summary, goal_amount, status')
  .eq('status', 'active')

// Better: Use the service layer for optimized queries
const fundraisers = await fundraiserService.getFundraisers({
  status: 'active',
  fields: ['id', 'title', 'summary', 'goal_amount']
})`}
              language="javascript"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leverage Caching</CardTitle>
            <CardDescription>Take advantage of automatic caching for repeated queries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Identical queries within the cache TTL (5 minutes) will return cached results instantly.
            </p>
            <CodeBlock 
              code={`// This pattern leverages caching effectively:
const loadDashboard = async () => {
  // These calls will be cached for 5 minutes
  const [fundraisers, categories, stats] = await Promise.all([
    fundraiserService.getFundraisers({ status: 'active', limit: 10 }),
    categoryService.getCategories(),
    categoryService.getCategoryStats()
  ])
  
  return { fundraisers, categories, stats }
}`}
              language="javascript"
            />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8">Error Handling</h2>
      <p className="text-muted-foreground mb-4">
        The API service automatically handles and retries common error conditions:
      </p>
      
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="font-semibold mb-3">Automatically Retried Errors:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Network timeouts (408)</li>
          <li>• Rate limiting (429)</li>  
          <li>• Server errors (500, 502, 503, 504)</li>
          <li>• Database connection issues</li>
          <li>• Temporary Supabase service unavailability</li>
        </ul>
      </div>
    </div>
  );
}