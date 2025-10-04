# Search Layer Root Cause Analysis (RCA)

## Executive Summary

**Critical Bug**: The search service (`src/lib/services/search.service.ts`) directly writes to the `search_results_cache` table, which violates the read-only projection principle of our event-driven architecture.

**Impact**: 
- Breaks separation of concerns
- Creates race conditions
- Makes cache invalidation unpredictable
- Violates SOLID principles

---

## Timeline of Events

### Original Implementation (Faulty)

**File**: `src/lib/services/search.service.ts`

**Violation 1** - Lines 382-386 (getCachedResults):
```typescript
private async getCachedResults(cacheKey: string): Promise<SearchResponse | null> {
  const { data, error } = await supabase
    .from('search_results_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    // ... READS from projection (OK)
```

**Violation 2** - Lines 406-413 (cacheResults):
```typescript
private async cacheResults(
  cacheKey: string,
  query: string,
  response: SearchResponse
): Promise<void> {
  await supabase
    .from('search_results_cache')
    .insert({  // ❌ WRITES to projection (VIOLATION)
      cache_key: cacheKey,
      query,
      results: response.results,
      suggestions: response.suggestions,
      result_count: response.results.length,
    });
}
```

### Additional Issues Found

1. **No Redis-based indexing**: Using slow PostgreSQL full-text search instead of RediSearch
2. **Frontend queries DB directly**: Via `useSearch` hook → violates API Gateway pattern
3. **Mixed responsibilities**: `search.service.ts` handles querying, caching, analytics, and projection writes
4. **No event streaming**: Changes don't propagate through proper event channels
5. **Performance**: Multi-word queries cause "syntax error in tsquery" (e.g., "vitaliy rusav")

---

## Root Causes

### 1. Architectural Violations

**Problem**: The search service was given dual responsibilities:
- **Query execution** (legitimate)
- **Cache management** (should be owned by Projection Builder)

**Why it happened**: No clear ownership boundaries defined in the original design.

### 2. Missing Infrastructure

**Problem**: No Redis-based search infrastructure exists.

**Current state**:
- ❌ No RediSearch indexes
- ❌ No event streams for search
- ❌ No dedicated indexer worker
- ❌ No projection builder service

### 3. Frontend Architecture Flaw

**Problem**: Frontend hooks (`useSearch`, `useEnhancedSearch`) directly query Supabase.

**Should be**: Frontend → API Gateway → Search Service → Redis

---

## Impact Analysis

### Performance Impact
- **Slow searches**: PostgreSQL FTS is 10-100x slower than RediSearch
- **No fuzzy matching**: Users get zero results for typos
- **Cache inefficiency**: Projections updated by wrong service

### Data Integrity Impact
- **Race conditions**: Multiple services writing to same tables
- **Stale cache**: No proper invalidation mechanism
- **Inconsistent state**: Projections may not reflect reality

### Developer Experience Impact
- **Debugging difficulty**: Hard to trace who updated what
- **Maintenance burden**: Code spread across frontend/backend
- **Testing complexity**: Can't test search in isolation

---

## Affected Files

### Services
- ✅ `src/lib/services/search.service.ts` - **DELETE cacheResults(), refactor getCachedResults()**
- ✅ `src/lib/services/searchSuggestions.service.ts` - May need updates

### Hooks (Frontend)
- ✅ `src/hooks/useSearch.tsx` - **REPLACE with API calls**
- ✅ `src/hooks/useEnhancedSearch.ts` - **REPLACE with API calls**
- ✅ `src/hooks/useOptimizedSearch.ts` - **REPLACE with API calls**
- ✅ `src/hooks/useSearchInput.ts` - Keep (UI state only)

### Event Layer
- ⚠️ `src/lib/events/domain/SearchEvents.ts` - Review event contracts

### Database
- ⚠️ `search_results_cache` table - RLS policies need review
- ⚠️ `user_search_projection` table - Should only be written by Projection Builder
- ⚠️ `campaign_search_projection` table - Should only be written by Projection Builder
- ⚠️ `organization_search_projection` table - Should only be written by Projection Builder

---

## Proposed Fix (High-Level)

### Phase 1: Immediate Fixes
1. **Delete** `cacheResults()` from `search.service.ts`
2. **Create** API Gateway: `supabase/functions/search-api/index.ts`
3. **Add runtime guard**: Prevent search process from writing to `*_projection` tables

### Phase 2: Infrastructure
1. **Setup RediSearch**: Create indexes `idx:users`, `idx:campaigns`, `idx:orgs`, `idx:all`
2. **Build Indexer Worker**: `supabase/functions/search-indexer/index.ts`
3. **Build Projection Builder**: `supabase/functions/projection-builder/index.ts`

### Phase 3: Event-Driven
1. **CDC triggers**: Emit events to Redis Streams on DB changes
2. **Event contracts**: Define schemas for all domain events

### Phase 4: Frontend Migration
1. **Update hooks**: Call Search API instead of direct Supabase queries
2. **Remove DB dependencies**: All search via API Gateway

---

## Acceptance Criteria for Fix

✅ **Zero writes to projections from search service** (enforced by RLS + runtime guards)  
✅ **Frontend only calls Search API** (no direct DB access)  
✅ **All tests pass** (unit + integration + E2E)  
✅ **Performance improved**: p95 < 150ms (vs current ~500ms+)  
✅ **Fuzzy search works**: Typo tolerance via RediSearch  

---

## Lessons Learned

1. **Define ownership clearly**: Each table/key must have exactly one writer
2. **Enforce boundaries**: Use RLS, runtime guards, CI checks
3. **Event-driven from start**: Don't bolt it on later
4. **API Gateway pattern**: Frontend never talks to DB directly
5. **Document architecture**: Make implicit rules explicit

---

## Next Steps

See `docs/search/architecture.md` for the complete rebuild plan.
