/**
 * API Documentation Categories page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsCategories() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Categories API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Manage fundraising categories and retrieve category statistics.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Categories are publicly accessible and help organize fundraisers by type.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Categories Management" 
        description="Retrieve fundraising categories and their statistics."
      >
        {/* List Categories */}
        <SwaggerEndpoint
          method="GET"
          path="/categories"
          summary="List categories"
          description="Retrieve all active fundraising categories"
          tags={['Categories']}
        >
          <EndpointDetails
            responses={[
              { status: '200', description: 'Array of category objects with metadata' },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get All Categories',
                code: `const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order')`
              },
              {
                title: 'With Campaign Counts',
                description: 'Get categories with associated campaign statistics',
                code: `import { categoryService } from '@/lib/services/category.service'

// Get categories with campaign counts
const categories = await categoryService.getCategoriesWithStats()

categories.forEach(category => {
  console.log(\`\${category.name}: \${category.campaign_count} campaigns\`)
})`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Category Statistics */}
        <SwaggerEndpoint
          method="POST"
          path="/rpc/get_category_stats"
          summary="Get category statistics"
          description="Retrieve statistics for all categories including campaign counts and total raised"
          tags={['Statistics']}
        >
          <EndpointDetails
            responses={[
              { status: '200', description: 'Array of category statistics with campaign counts and fundraising totals' },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get Category Statistics',
                code: `const { data, error } = await supabase
  .rpc('get_category_stats')

// Returns statistics for each category
data.forEach(stat => {
  console.log(\`\${stat.category_name}:\`)
  console.log(\`- Active campaigns: \${stat.active_campaigns}\`)
  console.log(\`- Total raised: $\${stat.total_raised}\`)
  console.log(\`- All-time campaigns: \${stat.campaign_count}\`)
})`
              },
              {
                title: 'Using Service Layer',
                description: 'Recommended approach with caching',
                code: `import { categoryService } from '@/lib/services/category.service'

const stats = await categoryService.getCategoryStats()

// Get the most popular category
const mostPopular = stats.reduce((prev, current) => 
  prev.campaign_count > current.campaign_count ? prev : current
)

console.log('Most popular category:', mostPopular.category_name)`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Common Use Cases" description="Practical examples for working with categories">
        <div className="grid gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Filter Categories by Usage</h4>
            <p className="text-sm text-muted-foreground mb-3">Show only categories that have active fundraisers</p>
            <CodeBlock 
              code={`// Get categories with active campaigns only
const { data, error } = await supabase
  .from('categories')
  .select(\`
    *,
    fundraisers!inner(id)
  \`)
  .eq('fundraisers.status', 'active')
  .eq('is_active', true)`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Category Color Mapping</h4>
            <p className="text-sm text-muted-foreground mb-3">Use category colors for UI consistency</p>
            <CodeBlock 
              code={`// Map categories to their colors for UI display
const categories = await categoryService.getCategories()

const categoryColorMap = categories.reduce((acc, category) => {
  acc[category.id] = {
    name: category.name,
    emoji: category.emoji,
    colorClass: category.color_class
  }
  return acc
}, {})`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}