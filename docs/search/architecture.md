# Search Layer Architecture

## Overview

The search layer follows an **event-driven CQRS architecture** with strict separation of concerns:

- **Commands** (writes) → Database → Event Streams → Indexer/Projection Builder
- **Queries** (reads) → Search API → RediSearch / Projections → Results

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WRITE PATH (Commands)                     │
└─────────────────────────────────────────────────────────────────┘

  User Action (Create/Update/Delete)
       ↓
  [Frontend] → [Mutation Service] → [Supabase PostgreSQL]
                                           ↓
                                    [DB Triggers/CDC]
                                           ↓
                            ┌──────────────┴──────────────┐
                            ↓                             ↓
                   [Redis Stream:               [Redis Stream:
                    events:users]                events:campaigns]
                            ↓                             ↓
              ┌─────────────┴─────────────┬───────────────┘
              ↓                           ↓
    [Search Indexer Worker]     [Projection Builder Worker]
    (Edge Function)              (Edge Function)
              ↓                           ↓
    [RediSearch Indexes]        [PostgreSQL Projections]
    - idx:users                 - user_search_projection
    - idx:campaigns             - campaign_search_projection
    - idx:orgs                  - organization_search_projection
    - idx:all                   - search_results_cache


┌─────────────────────────────────────────────────────────────────┐
│                         READ PATH (Queries)                      │
└─────────────────────────────────────────────────────────────────┘

  User Types Query
       ↓
  [Frontend] → [Search API Edge Function]
                     ↓
          ┌──────────┴──────────┐
          ↓                     ↓
   [RediSearch Query]    [Cache Lookup]
   (FT.SEARCH)           (search_results_cache)
          ↓                     ↓
   [Transform Results] ← [Cached Results]
          ↓
   [Return JSON to Frontend]
```

---

## Components

### 1. Database (Source of Truth)

**Tables**:
- `profiles` → User entities
- `fundraisers` → Campaign entities
- `organizations` → Organization entities

**Responsibilities**:
- ✅ Store canonical data
- ✅ Emit events on changes (via triggers)
- ❌ Never queried directly by frontend for search

**Triggers** (to be implemented):
```sql
-- Emit events to Redis Streams on INSERT/UPDATE/DELETE
CREATE TRIGGER emit_user_event AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:users');

CREATE TRIGGER emit_campaign_event AFTER INSERT OR UPDATE OR DELETE ON fundraisers
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:campaigns');

CREATE TRIGGER emit_org_event AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:orgs');
```

---

### 2. Redis Streams (Event Bus)

**Streams**:
- `events:users` → User lifecycle events
- `events:campaigns` → Campaign lifecycle events
- `events:orgs` → Organization lifecycle events

**Event Schema** (see `docs/search/events.md`):
```json
{
  "id": "evt_abc123",
  "type": "user.created",
  "aggregate_id": "uuid-of-user",
  "timestamp": "2025-01-15T12:34:56Z",
  "payload": { "userId": "...", "name": "...", "email": "..." },
  "metadata": { "correlation_id": "...", "causation_id": "..." }
}
```

**Consumers**:
1. **Search Indexer Worker** → Updates RediSearch indexes
2. **Projection Builder Worker** → Updates PostgreSQL projections

---

### 3. Search Indexer Worker (Edge Function)

**File**: `supabase/functions/search-indexer/index.ts`

**Responsibilities**:
- ✅ Consume events from Redis Streams
- ✅ Transform events → RediSearch documents
- ✅ Upsert to `idx:users`, `idx:campaigns`, `idx:orgs`, `idx:all`
- ✅ Handle deletes (soft + hard)
- ✅ Idempotent processing (track last processed event ID)
- ✅ Dead Letter Queue for poison events

**RediSearch Indexes**:

#### idx:users
```redis
FT.CREATE idx:users ON HASH PREFIX 1 users:
  SCHEMA
    display_name TEXT WEIGHT 5.0 SORTABLE
    username TEXT WEIGHT 4.0
    bio TEXT WEIGHT 2.0
    location TEXT
    role TAG
    org_ids TAG SEPARATOR ","
    visibility TAG
    account_status TAG
    is_verified TAG
    follower_count NUMERIC SORTABLE
    campaign_count NUMERIC SORTABLE
```

#### idx:campaigns
```redis
FT.CREATE idx:campaigns ON HASH PREFIX 1 campaigns:
  SCHEMA
    title TEXT WEIGHT 5.0 SORTABLE
    summary TEXT WEIGHT 3.0
    story_text TEXT WEIGHT 2.0
    beneficiary_name TEXT WEIGHT 3.0
    location TEXT
    category TAG
    status TAG
    visibility TAG
    owner_id TAG
    org_id TAG
    goal_amount NUMERIC SORTABLE
    total_raised NUMERIC SORTABLE
    created_at NUMERIC SORTABLE
```

#### idx:orgs
```redis
FT.CREATE idx:orgs ON HASH PREFIX 1 orgs:
  SCHEMA
    legal_name TEXT WEIGHT 5.0 SORTABLE
    dba_name TEXT WEIGHT 5.0
    description TEXT WEIGHT 2.0
    categories TAG SEPARATOR ","
    country TEXT
    verification_status TAG
```

#### idx:all (Unified Index)
```redis
FT.CREATE idx:all ON HASH PREFIX 3 users: campaigns: orgs:
  SCHEMA
    entity_type TAG
    primary_name TEXT WEIGHT 5.0 SORTABLE
    secondary_text TEXT WEIGHT 2.0
    tags TAG SEPARATOR ","
    visibility TAG
    status TAG
```

---

### 4. Projection Builder Worker (Edge Function)

**File**: `supabase/functions/projection-builder/index.ts`

**Responsibilities**:
- ✅ Consume events from Redis Streams
- ✅ **ONLY service that writes to `*_projection` tables**
- ✅ Update materialized views for complex queries
- ✅ Manage `search_results_cache` (write-only)
- ✅ Idempotent processing

**Projection Tables** (write-only by this service):
- `user_search_projection`
- `campaign_search_projection`
- `organization_search_projection`
- `search_results_cache`

**Access Control**:
```typescript
// Runtime guard in other services
if (process.env.SERVICE_NAME !== 'projection-builder') {
  if (operation.table.endsWith('_projection') && operation.type === 'write') {
    throw new Error('FORBIDDEN: Only projection-builder can write to projections');
  }
}
```

---

### 5. Search API (Edge Function)

**File**: `supabase/functions/search-api/index.ts`

**Endpoints**:

#### GET /search
```
GET /search?q=john&scope=all&limit=20&cursor=abc&filters=...

Query Parameters:
- q: Search query (required)
- scope: users|campaigns|orgs|all (default: all)
- limit: Results per page (default: 20, max: 100)
- cursor: Opaque pagination cursor (optional)
- filters: JSON-encoded filters (optional)
  - category: uuid
  - location: string
  - status: active|closed|...
  - visibility: public|private
```

**Response**:
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "campaign",
      "title": "Help John Doe",
      "subtitle": "Medical emergency fundraiser",
      "snippet": "...highlighted text...",
      "link": "/fundraiser/help-john-doe",
      "score": 0.95,
      "highlights": {
        "title": "Help <mark>John</mark> Doe"
      }
    }
  ],
  "suggestions": ["john doe", "john smith"],
  "total": 42,
  "cursor": "next_page_token",
  "executionTimeMs": 23,
  "cached": false
}
```

#### GET /search/suggest
```
GET /search/suggest?q=joh&limit=10

Response:
{
  "suggestions": [
    { "text": "john", "score": 1.0, "count": 50 },
    { "text": "john doe", "score": 0.9, "count": 12 }
  ]
}
```

#### POST /search/index/rebuild (Admin Only)
```
POST /search/index/rebuild

Authorization: Bearer <admin_token>

Response:
{
  "status": "started",
  "jobId": "rebuild_123",
  "estimated_duration_seconds": 120
}
```

**Search Algorithm**:

```typescript
// Fuzzy + Prefix + Exact with Boosting
const query = `
  (
    (@primary_name:${exactQuery})^3.0 |
    (@primary_name:%${fuzzyQuery}%)^2.0 |
    (@primary_name:${prefixQuery}*)^1.5 |
    (@secondary_text:%${fuzzyQuery}%)^1.0
  )
  @visibility:{public}
  @status:{active}
`;

const results = await redis.ft.search('idx:all', query, {
  LIMIT: { from: offset, size: limit },
  SORTBY: '_score',
  RETURN: ['entity_type', 'primary_name', 'secondary_text'],
  HIGHLIGHT: { FIELDS: ['primary_name', 'secondary_text'], TAGS: ['<mark>', '</mark>'] }
});
```

---

### 6. Frontend Integration

**Old (WRONG)**:
```typescript
// ❌ Direct DB access
const { data } = await supabase
  .from('campaign_search_projection')
  .select('*')
  .textSearch('fts', query);
```

**New (CORRECT)**:
```typescript
// ✅ Via API Gateway
import { searchApi } from '@/lib/services/searchApi.service';

const results = await searchApi.search({
  query: 'john',
  scope: 'all',
  limit: 20
});
```

**Updated Hooks**:
- `useEnhancedSearch` → Calls `searchApi.search()`
- `useOptimizedSearch` → Wrapper around `useEnhancedSearch`
- `useSearchInput` → UI state only (no changes needed)

---

## Data Flow Examples

### Example 1: User Creates Campaign

```
1. User submits form → Frontend
2. Frontend → mutationService.createCampaign()
3. mutationService → Supabase INSERT into fundraisers
4. DB Trigger → Emit { type: 'campaign.created', payload: {...} } to events:campaigns
5. Search Indexer consumes event → FT.ADD to idx:campaigns
6. Projection Builder consumes event → INSERT into campaign_search_projection
7. User searches "my campaign" → Frontend → Search API
8. Search API → FT.SEARCH idx:campaigns → Returns results
```

### Example 2: User Searches "john doe"

```
1. User types "john doe" → Frontend (useSearchInput)
2. Debounced (50ms) → useEnhancedSearch calls searchApi.search()
3. Search API → Check cache (search_results_cache) → MISS
4. Search API → FT.SEARCH idx:all "@primary_name:%john% @primary_name:%doe%"
5. RediSearch returns 23 results (users + campaigns)
6. Search API transforms results → JSON response
7. Projection Builder (async) → Cache results for future queries
8. Frontend displays results with highlights
```

---

## Security

### Authentication
- Search API requires `Authorization: Bearer <supabase_jwt>`
- Anonymous search allowed with rate limiting (10 req/min)

### Authorization
- **Private campaigns**: Filtered out unless user is owner/org member
- **User visibility**: Respect `profile_visibility` setting
- **Admin endpoints**: Require `super_admin` role

### Rate Limiting
- **Authenticated**: 100 req/min per user
- **Anonymous**: 10 req/min per IP
- **Search indexer**: No limit (service role)

---

## Performance SLAs

| Metric | Target | Current (Baseline) |
|--------|--------|-------------------|
| p50 latency (warm) | < 50ms | ~200ms |
| p95 latency (warm) | < 150ms | ~500ms |
| p99 latency (warm) | < 300ms | ~1000ms |
| Cache hit rate | > 60% | 0% (broken) |
| Index lag (event → searchable) | < 2s | N/A (no indexer) |
| Fuzzy match accuracy | > 90% | 0% (not implemented) |

---

## Monitoring & Alerts

### Metrics (to be collected)
- `search_api_requests_total{scope, status}`
- `search_api_latency_seconds{scope, quantile}`
- `search_indexer_lag_seconds{stream}`
- `search_cache_hit_rate{scope}`
- `redisearch_index_size{index}`
- `search_error_rate{service}`

### Alerts
- 🚨 **Index lag > 5s** → Indexer is falling behind
- 🚨 **p95 latency > 200ms** → Performance degradation
- 🚨 **Error rate > 1%** → Service issues
- ⚠️ **Cache hit rate < 40%** → Cache inefficiency

---

## Deployment Strategy

### Phase 1: Infrastructure (Week 1)
- Setup Redis Stack with RediSearch module
- Deploy search-indexer edge function
- Deploy projection-builder edge function
- Deploy search-api edge function

### Phase 2: Migration (Week 2)
- Run backfill script (populate Redis from DB)
- Parallel run (old + new search side-by-side)
- A/B test with 10% traffic to new API

### Phase 3: Cutover (Week 3)
- Increase traffic to 50% → 100%
- Deprecate old search hooks
- Remove direct DB queries from frontend
- Monitor for 1 week

### Phase 4: Cleanup (Week 4)
- Delete old search.service.ts write methods
- Archive old projection update code
- Add RLS guards to prevent future violations

---

## Ownership Matrix

| Component | Write | Read | Owner |
|-----------|-------|------|-------|
| `profiles` table | mutation.service | projection-builder, indexer | Database |
| `events:users` stream | DB triggers | indexer, projection-builder | Event Bus |
| `idx:users` index | search-indexer | search-api | Search Indexer |
| `user_search_projection` | projection-builder | search-api (optional) | Projection Builder |
| `search_results_cache` | projection-builder | search-api | Projection Builder |
| Search API | - | Frontend | API Gateway |

**Rule**: If a component is not listed as "Write" owner, it **MUST NOT** write to that resource.

---

## Runbook

See `docs/search/runbook.md` for operational procedures.
