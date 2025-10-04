# Search Layer Implementation Roadmap

## ✅ Completed: Phase 0 - Documentation

All architectural documentation is now complete:
- ✅ `docs/search/rca.md` - Root cause analysis
- ✅ `docs/search/architecture.md` - System design & data flow
- ✅ `docs/search/events.md` - Event contracts & schemas
- ✅ `docs/search/benchmarks.md` - Performance targets & test plans

---

## 🚀 Next: Phase 1 - Infrastructure Setup

### Step 1.1: Redis Stack Setup
```bash
# Verify Redis Stack with RediSearch is available
# Already configured via UPSTASH_REDIS_REST_URL

# Test connection
curl -X POST https://your-redis-url/ft.info/idx:users
```

### Step 1.2: Create Edge Functions
Create these three edge functions:

1. **search-api** (`supabase/functions/search-api/index.ts`)
   - API Gateway for all search requests
   - Endpoints: GET /search, GET /search/suggest
   - Priority: HIGH (blocks frontend)

2. **search-indexer** (`supabase/functions/search-indexer/index.ts`)
   - Consumes Redis Streams
   - Updates RediSearch indexes
   - Priority: HIGH (core functionality)

3. **projection-builder** (`supabase/functions/projection-builder/index.ts`)
   - Only service writing to *_projection tables
   - Priority: MEDIUM (optimization)

### Step 1.3: Database Triggers
Create triggers to emit events to Redis Streams:
```sql
-- See docs/search/events.md for full implementation
CREATE TRIGGER emit_user_event ...
CREATE TRIGGER emit_campaign_event ...
CREATE TRIGGER emit_org_event ...
```

---

## Phase 2 - Search Service Implementation

### Priority Order:
1. **search-api** - Create REST API with RediSearch queries
2. **search-indexer** - Build event consumer & indexer
3. **Frontend migration** - Update hooks to use API instead of direct DB
4. **projection-builder** - Move cache writes here
5. **Backfill script** - Populate Redis from existing data

---

## Phase 3 - Testing & Validation

1. Unit tests for each service
2. Integration tests (event → index → query)
3. Load testing (see benchmarks.md)
4. Parallel run (old + new) for 1 week

---

## Phase 4 - Cutover & Cleanup

1. Route 100% traffic to new API
2. Delete write methods from old search.service.ts
3. Add RLS guards to prevent future violations
4. Monitor for 2 weeks

---

## Critical Rules (Enforced)

❌ **NEVER** write to `*_projection` tables from search services
❌ **NEVER** query database directly from frontend
✅ **ALWAYS** use Search API as gateway
✅ **ALWAYS** emit events for data changes

---

## Next Command to Run

```bash
# Start with creating the Search API edge function
npm run create:edge-function search-api
```

Shall I proceed with creating the edge functions?
