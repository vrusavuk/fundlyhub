export const EventsCQRS = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">CQRS Projections</h1>
        <p className="text-xl text-muted-foreground">
          Command Query Responsibility Segregation and read-optimized projection tables
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What is CQRS?</h2>
        <p className="text-muted-foreground">
          CQRS separates write operations (Commands) from read operations (Queries) by maintaining separate models for each.
          This allows optimization of both paths independently.
        </p>
        
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">Benefits:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Performance</strong>: Read models are pre-computed and optimized for queries</li>
            <li><strong>Scalability</strong>: Read and write databases can be scaled independently</li>
            <li><strong>Flexibility</strong>: Multiple read models for different use cases</li>
            <li><strong>Eventual Consistency</strong>: Acceptable for most non-critical reads</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">CQRS Architecture</h2>
        <p className="text-muted-foreground mb-4">
          Architecture diagrams available in full documentation
        </p>
{`graph LR
    A[User Request] --> B{Type?}
    B -->|Write| C[Command Handler]
    B -->|Read| D[Query Handler]
    C --> E[Write to Main Table]
    E --> F[Publish Domain Event]
    F --> G[Event Processor]
    G --> H[Update Projections]
    H --> I[Projection Tables]
    D --> I
    I --> J[Return Data]
    
    style C fill:#e1f5ff
    style D fill:#ffe1e1
    style E fill:#e1f5ff
    style I fill:#ffe1e1`}
        </lov-mermaid>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Campaign Projection Tables</h2>
        <p className="text-muted-foreground mb-4">
          FundlyHub maintains three specialized projection tables for campaigns:
        </p>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">campaign_summary_projection</h3>
            <p className="text-muted-foreground mb-3">
              Optimized for listing campaigns with essential information.
            </p>
            <div className="bg-muted rounded-lg p-3">
              <h4 className="font-semibold mb-2">Fields:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>campaign_id, title, slug, summary</li>
                <li>owner_user_id, owner_name, owner_avatar</li>
                <li>org_id, org_name</li>
                <li>category_id, cover_image</li>
                <li>goal_amount, total_raised, progress_percentage</li>
                <li>donor_count, days_remaining</li>
                <li>status, visibility, created_at, updated_at</li>
              </ul>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <strong>Use Case:</strong> Campaign listings, homepage, category pages
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">campaign_stats_projection</h3>
            <p className="text-muted-foreground mb-3">
              Aggregated statistics for campaign analytics.
            </p>
            <div className="bg-muted rounded-lg p-3">
              <h4 className="font-semibold mb-2">Fields:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>campaign_id</li>
                <li>total_donations, donation_count, unique_donors</li>
                <li>average_donation, peak_donation_amount</li>
                <li>view_count, share_count, comment_count, update_count</li>
                <li>first_donation_at, last_donation_at</li>
                <li>updated_at</li>
              </ul>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <strong>Use Case:</strong> Campaign detail pages, analytics dashboards
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">campaign_search_projection</h3>
            <p className="text-muted-foreground mb-3">
              Optimized for full-text search with pre-computed search vectors.
            </p>
            <div className="bg-muted rounded-lg p-3">
              <h4 className="font-semibold mb-2">Fields:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>campaign_id, title, summary, story_text</li>
                <li>owner_name, org_name, category_name</li>
                <li>location, tags</li>
                <li>search_vector (tsvector for full-text search)</li>
                <li>status, visibility, created_at, updated_at</li>
              </ul>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <strong>Use Case:</strong> Search functionality, filtering, recommendations
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Other Projection Tables</h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">donor_history_projection</h3>
            <p className="text-muted-foreground">
              Aggregated donation history per user: total_donated, donation_count, campaigns_supported, average_donation, first/last donation dates.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">campaign_analytics_projection</h3>
            <p className="text-muted-foreground">
              Time-series analytics data for campaigns: daily donation trends, conversion metrics, engagement rates.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Projection Update Flow</h2>
        <p className="text-muted-foreground mb-4">
          This diagram shows how projections are updated when events occur:
        </p>
        
        <lov-mermaid>
{`sequenceDiagram
    participant U as User
    participant C as Command Handler
    participant DB as Main Database
    participant E as Event Bus
    participant P as Projection Processor
    participant PDB as Projection Tables

    U->>C: Create Campaign
    C->>DB: Insert into fundraisers
    DB-->>C: Success
    C->>E: Publish campaign.created event
    E->>P: Dispatch to Processor
    
    par Parallel Projection Updates
        P->>PDB: Update campaign_summary_projection
        P->>PDB: Update campaign_stats_projection
        P->>PDB: Update campaign_search_projection
    end
    
    P-->>E: Processing Complete
    Note over PDB: Projections are<br/>eventually consistent`}
        </lov-mermaid>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Eventual Consistency</h2>
        <p className="text-muted-foreground">
          Projections are updated asynchronously, which means there's a small delay between the write and the updated read model.
        </p>
        
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Handling Consistency:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Critical Reads</strong>: Query main tables directly (e.g., payment processing)</li>
            <li><strong>Non-Critical Reads</strong>: Use projections for better performance (e.g., listings)</li>
            <li><strong>User Feedback</strong>: Show "Processing..." or stale data indicators when needed</li>
            <li><strong>Idempotency</strong>: Ensures projections eventually reach correct state</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Querying Projections</h2>
        <p className="text-muted-foreground">
          Projections are queried just like regular tables but provide better performance:
        </p>
        
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code>{`// Query campaign summary projection (FAST)
const { data } = await supabase
  .from('campaign_summary_projection')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);

// vs. Joining multiple tables (SLOW)
const { data } = await supabase
  .from('fundraisers')
  .select(\`
    *,
    profiles!owner_user_id(*),
    organizations(*),
    categories(*),
    donations(count)
  \`)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);`}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Projection Maintenance</h2>
        <p className="text-muted-foreground">
          Projections require occasional maintenance:
        </p>
        
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold">Rebuilding Projections</h4>
            <p className="text-sm text-muted-foreground">
              If projections get out of sync, they can be rebuilt by replaying events from the event store.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold">Monitoring</h4>
            <p className="text-sm text-muted-foreground">
              Track projection lag (time between event and projection update) to ensure system health.
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold">Schema Evolution</h4>
            <p className="text-sm text-muted-foreground">
              When adding new fields to projections, run a one-time migration to backfill existing data.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Always use projections for list/search queries</li>
          <li>Query main tables only for critical operations requiring strong consistency</li>
          <li>Keep projections denormalized - duplication is OK</li>
          <li>Index projection tables for common query patterns</li>
          <li>Monitor projection lag and set alerts for delays</li>
          <li>Design projections for specific use cases, not as generic views</li>
          <li>Use RLS policies on projections to maintain security</li>
        </ul>
      </section>
    </div>
  );
};

export default EventsCQRS;