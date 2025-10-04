# Search Layer Operations Runbook

## Quick Reference

| Task | Command | Documentation |
|------|---------|---------------|
| Check search health | `curl /search-api/health` | See Health Checks |
| Run backfill | `deno run scripts/search_backfill.ts` | See Bootstrap |
| Rebuild indexes | `deno run scripts/reindex.ts` | See Reindexing |
| View search logs | Supabase Dashboard → Edge Functions | See Monitoring |
| Clear cache | Manual SQL (see Cache Management) | See Cache section |

---

## Health Checks

### API Health
```bash
curl https://sgcaqrtnxqhrrqzxmupa.supabase.co/functions/v1/search-api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:34:56Z"
}
```

### Check Redis Connection
```bash
# Via Upstash Console or CLI
redis-cli PING
# Expected: PONG
```

### Check Index Status
```bash
# Via Upstash or Redis CLI
FT.INFO idx:users
FT.INFO idx:campaigns
FT.INFO idx:orgs
```

---

## Bootstrap & Initialization

### Initial Setup (First Time)

1. **Create RediSearch Indexes**
```bash
# Run the index creation script
deno run --allow-net --allow-env scripts/create_redis_indexes.ts
```

2. **Backfill Data from Database**
```bash
# Populate Redis from existing PostgreSQL data
deno run --allow-net --allow-env scripts/search_backfill.ts
```

Expected output:
```
✅ Backfill started
📊 Processing 100,000 users...
📊 Processing 50,000 campaigns...
📊 Processing 5,000 organizations...
✅ Backfill complete: 155,000 documents indexed in 3m 42s
```

3. **Verify Indexes**
```bash
# Check document counts
redis-cli FT.SEARCH idx:users "*" LIMIT 0 0
# Should show: "results: 100000"
```

---

## Cache Management

### Clear All Cached Results
```sql
-- Via Supabase SQL Editor
DELETE FROM search_results_cache WHERE expires_at < NOW();
```

### Clear Specific Query Cache
```sql
DELETE FROM search_results_cache 
WHERE cache_key LIKE 'search:your-query%';
```

### View Cache Statistics
```sql
SELECT 
  COUNT(*) as total_cached_queries,
  SUM(hit_count) as total_hits,
  AVG(result_count) as avg_results_per_query,
  MIN(created_at) as oldest_cache,
  MAX(created_at) as newest_cache
FROM search_results_cache;
```

---

## Reindexing

### Full Reindex (Rebuild Everything)
```bash
# ⚠️ This will cause brief search downtime
deno run --allow-net --allow-env scripts/reindex.ts --full
```

Steps performed:
1. Create new indexes with temp names (idx:users_temp, etc.)
2. Populate temp indexes from projections
3. Atomic rename: temp → production
4. Delete old indexes

Duration: ~3-5 minutes for 100k+ docs

### Incremental Reindex (Specific Entity Type)
```bash
# Reindex only users
deno run --allow-net --allow-env scripts/reindex.ts --type=users

# Reindex only campaigns
deno run --allow-net --allow-env scripts/reindex.ts --type=campaigns
```

### Verify Reindex Success
```bash
# Check document counts match DB
deno run scripts/verify_index_integrity.ts
```

---

## Monitoring

### Key Metrics to Watch

| Metric | Threshold | Alert Level | Action |
|--------|-----------|-------------|--------|
| Search API p95 latency | > 200ms | Warning | Check Redis performance |
| Search API p99 latency | > 500ms | Critical | Scale Redis / Add replicas |
| Event lag (indexer) | > 5s | Warning | Check indexer logs |
| Event lag (indexer) | > 30s | Critical | Restart indexer worker |
| Error rate | > 1% | Warning | Check logs |
| Error rate | > 5% | Critical | Rollback / Incident |
| Cache hit rate | < 40% | Info | Review cache TTL |
| Index size growth | > 10GB | Info | Plan for scaling |

### View Real-Time Logs

**Search API Logs**:
```bash
# Via Supabase Dashboard
https://supabase.com/dashboard/project/sgcaqrtnxqhrrqzxmupa/functions/search-api/logs
```

**Indexer Logs**:
```bash
# Via Supabase Dashboard
https://supabase.com/dashboard/project/sgcaqrtnxqhrrqzxmupa/functions/search-indexer/logs
```

### Query Slow Searches
```sql
-- Find slowest queries in last 24 hours
SELECT query, execution_time_ms, result_count, created_at
FROM search_analytics
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY execution_time_ms DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Search returning zero results

**Diagnosis**:
```bash
# 1. Check if indexes exist
redis-cli FT._LIST

# 2. Check document count
redis-cli FT.SEARCH idx:all "*" LIMIT 0 0

# 3. Test direct Redis query
redis-cli FT.SEARCH idx:users "@name:john" LIMIT 10 10
```

**Fix**:
- If indexes missing → Run `scripts/create_redis_indexes.ts`
- If documents missing → Run `scripts/search_backfill.ts`
- If query syntax error → Check query escaping in search-api

---

### Issue: High latency (p95 > 200ms)

**Diagnosis**:
```sql
-- Check projection table sizes
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE '%_projection'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Fix**:
- Large projections → Add indexes on frequently filtered columns
- Redis slow → Scale to larger instance
- Network latency → Check edge function region

---

### Issue: Stale search results

**Diagnosis**:
```bash
# Check event lag
redis-cli XINFO STREAM events:users
redis-cli XINFO STREAM events:campaigns

# Check last processed event ID
redis-cli GET indexer:last_processed:users
```

**Fix**:
- High lag → Restart indexer worker
- No events flowing → Check DB triggers
- Indexer errors → Check DLQ: `redis-cli XRANGE dlq:events:users - +`

---

### Issue: "Row violates RLS policy" errors

**Diagnosis**:
```sql
-- Check RLS policies on event_store
SELECT * FROM pg_policies WHERE tablename = 'event_store';
```

**Fix**:
```sql
-- Ensure search events allowed
CREATE POLICY "Allow search events from anyone" 
ON event_store 
FOR INSERT 
WITH CHECK (event_type LIKE 'search.%' OR auth.role() = 'authenticated');
```

---

## Emergency Procedures

### Rollback to Old Search (If New Search Fails)

1. **Frontend**: Comment out `searchApi` imports, restore `searchService`
```typescript
// import { searchApi } from '@/lib/services/searchApi.service';
import { searchService } from '@/lib/services/search.service';
```

2. **Database**: Existing projections still work, no changes needed

3. **Monitoring**: Monitor error rate for 10 minutes

### Complete Search Outage

1. **Immediate**: Return cached results only
```typescript
// In search-api edge function, skip live queries
const cachedOnly = url.searchParams.get('cached_only') === 'true';
if (cachedOnly) {
  return cachedResults || { results: [], total: 0 };
}
```

2. **Within 5 min**: Check Redis health, restart if needed
3. **Within 15 min**: Failover to PostgreSQL FTS (old search.service.ts)
4. **Within 1 hour**: Root cause analysis

---

## Maintenance

### Weekly Tasks
- [ ] Review slow query log
- [ ] Check cache hit rate trends
- [ ] Verify index integrity (`scripts/verify_index_integrity.ts`)
- [ ] Review error rate dashboard

### Monthly Tasks
- [ ] Analyze search analytics for UX improvements
- [ ] Review and optimize ranking algorithms
- [ ] Check index size growth trends
- [ ] Test disaster recovery procedure

### Quarterly Tasks
- [ ] Load test with 2x expected peak traffic
- [ ] Review and update SLAs
- [ ] Capacity planning review
- [ ] Security audit of search layer

---

## Scaling

### When to Scale Redis

**Scale Up (Vertical)**:
- Memory usage > 80%
- CPU usage > 70% sustained
- Latency p95 > 150ms

**Scale Out (Horizontal)**:
- Throughput > 800 req/s sustained
- Need for geographic distribution
- Separate read replicas for analytics

### When to Add More Edge Function Instances

- Cold start rate > 5%
- Function CPU > 80%
- Request queue depth > 100

---

## Data Retention

### Search Results Cache
- **TTL**: 1 hour (configurable)
- **Max size**: 10,000 queries
- **Eviction**: LRU (Least Recently Used)

### Event Store
- **Retention**: 90 days
- **Archival**: S3 for compliance
- **Cleanup**: Automated weekly job

### Search Analytics
- **Retention**: 1 year
- **Aggregation**: Daily rollups after 30 days
- **Anonymization**: Remove user_id after 90 days

---

## Security

### Rate Limiting
```typescript
// Per-user limits (enforced in search-api)
const RATE_LIMITS = {
  authenticated: 100, // requests per minute
  anonymous: 10,      // requests per minute
};
```

### API Key Rotation
1. Generate new Supabase service role key
2. Update `SUPABASE_SERVICE_ROLE_KEY` secret in edge functions
3. Deploy updated edge functions
4. Verify health check passes

### Audit Search Access
```sql
-- View recent search queries by user
SELECT 
  user_id, 
  COUNT(*) as search_count,
  array_agg(DISTINCT query) as unique_queries
FROM event_store
WHERE event_type = 'search.query.submitted'
  AND occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY search_count DESC
LIMIT 100;
```

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | eng-oncall@ | PagerDuty |
| Search Team Lead | search-lead@ | Slack #search-alerts |
| Infrastructure Team | infra@ | Slack #incidents |
| Security Team | security@ | Slack #security |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2025-01-15 | Initial runbook created | Search Team |
| 2025-01-20 | Added Redis scaling guide | DevOps |
| 2025-02-01 | Updated rate limits | Security |
