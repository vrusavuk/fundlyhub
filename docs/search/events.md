# Search Event Contracts

## Overview

This document defines the event schemas for the search layer. All events follow a consistent structure and are published to Redis Streams.

---

## Base Event Schema

All events inherit from this base schema:

```typescript
interface DomainEvent<T = any> {
  id: string;                    // Unique event ID (uuid)
  type: string;                  // Event type (e.g., "user.created")
  aggregate_id: string;          // Entity ID (user_id, campaign_id, org_id)
  timestamp: number;             // Unix timestamp (ms)
  version: string;               // Event schema version (e.g., "1.0.0")
  payload: T;                    // Event-specific data
  metadata: {
    correlation_id?: string;     // Groups related events
    causation_id?: string;       // Event that caused this event
    user_id?: string;            // Actor who triggered this event
    ip_address?: string;         // Source IP
    user_agent?: string;         // Client info
  };
}
```

---

## User Events

### user.created

Emitted when a new user profile is created.

```typescript
interface UserCreatedPayload {
  userId: string;
  name: string;
  email: string;
  role: 'visitor' | 'creator' | 'org_admin' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  profileVisibility: 'public' | 'private';
  accountStatus: 'active';
}

// Example
{
  "id": "evt_01HV8ZQJ7YKXM9N0P2R3S4T5V6",
  "type": "user.created",
  "aggregate_id": "usr_abc123",
  "timestamp": 1705329600000,
  "version": "1.0.0",
  "payload": {
    "userId": "usr_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "visitor",
    "profileVisibility": "public",
    "accountStatus": "active"
  },
  "metadata": {
    "correlation_id": "cor_signup_flow_123",
    "user_id": "usr_abc123"
  }
}
```

**Indexer Action**: 
- Create document in `idx:users` with key `users:usr_abc123`
- Set initial search fields (name, bio, location, role)

**Projection Builder Action**:
- INSERT into `user_search_projection`

---

### user.updated

Emitted when user profile is updated.

```typescript
interface UserUpdatedPayload {
  userId: string;
  changes: {
    name?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    website?: string;
    socialLinks?: Record<string, string>;
  };
  previousValues?: Partial<UserCreatedPayload>;
}

// Example
{
  "id": "evt_01HV8ZQXYZABC",
  "type": "user.updated",
  "aggregate_id": "usr_abc123",
  "timestamp": 1705330000000,
  "version": "1.0.0",
  "payload": {
    "userId": "usr_abc123",
    "changes": {
      "bio": "Updated bio text",
      "location": "New York, NY"
    },
    "previousValues": {
      "bio": "Old bio",
      "location": "Boston, MA"
    }
  },
  "metadata": {
    "correlation_id": "cor_profile_update_456",
    "user_id": "usr_abc123"
  }
}
```

**Indexer Action**: 
- Update document `users:usr_abc123` with new values
- Re-index changed fields

**Projection Builder Action**:
- UPDATE `user_search_projection` SET ... WHERE user_id = ...

---

### user.deleted

Emitted when user account is deleted (soft or hard).

```typescript
interface UserDeletedPayload {
  userId: string;
  deletionType: 'soft' | 'hard';
  deletedAt: string; // ISO timestamp
  reason?: string;
}

// Example
{
  "id": "evt_01HV900ABC",
  "type": "user.deleted",
  "aggregate_id": "usr_abc123",
  "timestamp": 1705340000000,
  "version": "1.0.0",
  "payload": {
    "userId": "usr_abc123",
    "deletionType": "soft",
    "deletedAt": "2025-01-15T18:00:00Z",
    "reason": "User requested account deletion"
  },
  "metadata": {
    "correlation_id": "cor_account_deletion_789",
    "user_id": "usr_abc123"
  }
}
```

**Indexer Action**: 
- If soft delete: Update document with `status:deleted` tag (exclude from public searches)
- If hard delete: `FT.DEL idx:users users:usr_abc123`

**Projection Builder Action**:
- UPDATE `user_search_projection` SET deleted_at = ... (soft)
- DELETE FROM `user_search_projection` WHERE user_id = ... (hard)

---

## Campaign Events

### campaign.created

Emitted when a new fundraiser/campaign is created.

```typescript
interface CampaignCreatedPayload {
  campaignId: string;
  title: string;
  slug: string;
  summary: string;
  storyText: string;
  goalAmount: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  ownerId: string;
  ownerName: string;
  orgId?: string;
  orgName?: string;
  beneficiaryName?: string;
  location?: string;
  status: 'draft' | 'pending' | 'active';
  visibility: 'public' | 'private';
  coverImage?: string;
  tags?: string[];
  endDate?: string;
}

// Example
{
  "id": "evt_campaign_create_xyz",
  "type": "campaign.created",
  "aggregate_id": "cmp_123",
  "timestamp": 1705329600000,
  "version": "1.0.0",
  "payload": {
    "campaignId": "cmp_123",
    "title": "Help Save the Community Center",
    "slug": "help-save-community-center",
    "summary": "Raising funds to renovate our local community center",
    "storyText": "Full story text here...",
    "goalAmount": 50000,
    "currency": "USD",
    "categoryId": "cat_education",
    "categoryName": "Education",
    "ownerId": "usr_abc123",
    "ownerName": "John Doe",
    "status": "active",
    "visibility": "public",
    "location": "New York, NY",
    "tags": ["community", "education", "renovation"]
  },
  "metadata": {
    "correlation_id": "cor_campaign_creation_001",
    "user_id": "usr_abc123"
  }
}
```

**Indexer Action**: 
- Create document in `idx:campaigns` with key `campaigns:cmp_123`
- Index title, summary, story_text, location, tags
- Set status and visibility tags

**Projection Builder Action**:
- INSERT into `campaign_search_projection`

---

### campaign.updated

Emitted when campaign details are updated.

```typescript
interface CampaignUpdatedPayload {
  campaignId: string;
  changes: {
    title?: string;
    summary?: string;
    storyText?: string;
    status?: 'draft' | 'pending' | 'active' | 'paused' | 'closed' | 'ended';
    visibility?: 'public' | 'private';
    goalAmount?: number;
    location?: string;
    tags?: string[];
  };
  previousValues?: Partial<CampaignCreatedPayload>;
}
```

**Indexer Action**: 
- Update document `campaigns:cmp_123` with new values
- Re-index changed text fields

**Projection Builder Action**:
- UPDATE `campaign_search_projection` SET ... WHERE campaign_id = ...

---

### campaign.deleted

Emitted when campaign is deleted.

```typescript
interface CampaignDeletedPayload {
  campaignId: string;
  deletionType: 'soft' | 'hard';
  deletedAt: string;
  deletedBy: string;
  reason?: string;
}
```

**Indexer Action**: 
- Soft: Update with `status:deleted` tag
- Hard: `FT.DEL idx:campaigns campaigns:cmp_123`

**Projection Builder Action**:
- UPDATE or DELETE `campaign_search_projection`

---

### campaign.donation_received

Emitted when a donation is made (may trigger search re-ranking).

```typescript
interface CampaignDonationReceivedPayload {
  campaignId: string;
  donationId: string;
  amount: number;
  currency: string;
  donorId?: string;
  totalRaised: number; // New total
  donorCount: number;  // New count
}
```

**Indexer Action**: 
- Update `total_raised` and `donor_count` fields in index
- Boost relevance score (popular campaigns rank higher)

**Projection Builder Action**:
- UPDATE `campaign_search_projection` SET total_raised = ..., donor_count = ...

---

## Organization Events

### organization.created

Emitted when a new organization is registered.

```typescript
interface OrganizationCreatedPayload {
  orgId: string;
  legalName: string;
  dbaName?: string;
  website?: string;
  country: string;
  categories: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  ein?: string;
}

// Example
{
  "id": "evt_org_create_abc",
  "type": "organization.created",
  "aggregate_id": "org_456",
  "timestamp": 1705329600000,
  "version": "1.0.0",
  "payload": {
    "orgId": "org_456",
    "legalName": "Community Foundation Inc",
    "dbaName": "Community Foundation",
    "country": "US",
    "categories": ["education", "community"],
    "verificationStatus": "pending"
  },
  "metadata": {
    "correlation_id": "cor_org_registration_123",
    "user_id": "usr_xyz"
  }
}
```

**Indexer Action**: 
- Create document in `idx:orgs` with key `orgs:org_456`
- Index legal_name, dba_name, categories

**Projection Builder Action**:
- INSERT into `organization_search_projection`

---

### organization.updated

Emitted when organization details are updated.

```typescript
interface OrganizationUpdatedPayload {
  orgId: string;
  changes: {
    legalName?: string;
    dbaName?: string;
    website?: string;
    categories?: string[];
    verificationStatus?: 'pending' | 'approved' | 'rejected';
  };
  previousValues?: Partial<OrganizationCreatedPayload>;
}
```

**Indexer Action**: 
- Update document `orgs:org_456` with new values
- Re-index changed fields

**Projection Builder Action**:
- UPDATE `organization_search_projection` SET ... WHERE org_id = ...

---

### organization.deleted

Emitted when organization is deleted.

```typescript
interface OrganizationDeletedPayload {
  orgId: string;
  deletionType: 'soft' | 'hard';
  deletedAt: string;
  reason?: string;
}
```

**Indexer Action**: 
- Soft: Mark as deleted
- Hard: `FT.DEL idx:orgs orgs:org_456`

**Projection Builder Action**:
- UPDATE or DELETE `organization_search_projection`

---

## Search-Specific Events

### search.query_executed

Emitted when a search query is performed (for analytics).

```typescript
interface SearchQueryExecutedPayload {
  query: string;
  scope: 'users' | 'campaigns' | 'orgs' | 'all';
  resultCount: number;
  executionTimeMs: number;
  userId?: string;
  sessionId?: string;
  filters?: Record<string, any>;
}
```

**Indexer Action**: None

**Projection Builder Action**:
- Update `search_results_cache` (upsert)
- Track query popularity for suggestions

---

### search.result_clicked

Emitted when user clicks a search result.

```typescript
interface SearchResultClickedPayload {
  query: string;
  resultId: string;
  resultType: 'user' | 'campaign' | 'org';
  position: number; // 0-indexed position in results
  userId?: string;
  sessionId?: string;
}
```

**Indexer Action**: 
- Boost clicked result's relevance score

**Projection Builder Action**:
- Record click-through analytics

---

## Event Publishing

### Database Triggers (PostgreSQL)

```sql
-- Generic function to publish events to Redis Streams
CREATE OR REPLACE FUNCTION publish_to_redis_stream(stream_name TEXT)
RETURNS TRIGGER AS $$
DECLARE
  event_payload JSONB;
  event_id TEXT;
BEGIN
  event_id := gen_random_uuid()::TEXT;
  
  IF TG_OP = 'INSERT' THEN
    event_payload := jsonb_build_object(
      'id', event_id,
      'type', TG_TABLE_NAME || '.created',
      'aggregate_id', NEW.id::TEXT,
      'timestamp', extract(epoch from now()) * 1000,
      'version', '1.0.0',
      'payload', row_to_json(NEW),
      'metadata', jsonb_build_object(
        'correlation_id', event_id,
        'user_id', auth.uid()::TEXT
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    event_payload := jsonb_build_object(
      'id', event_id,
      'type', TG_TABLE_NAME || '.updated',
      'aggregate_id', NEW.id::TEXT,
      'timestamp', extract(epoch from now()) * 1000,
      'version', '1.0.0',
      'payload', jsonb_build_object(
        'changes', row_to_json(NEW),
        'previousValues', row_to_json(OLD)
      ),
      'metadata', jsonb_build_object(
        'correlation_id', event_id,
        'user_id', auth.uid()::TEXT
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    event_payload := jsonb_build_object(
      'id', event_id,
      'type', TG_TABLE_NAME || '.deleted',
      'aggregate_id', OLD.id::TEXT,
      'timestamp', extract(epoch from now()) * 1000,
      'version', '1.0.0',
      'payload', jsonb_build_object(
        'deletionType', CASE WHEN OLD.deleted_at IS NOT NULL THEN 'soft' ELSE 'hard' END
      ),
      'metadata', jsonb_build_object(
        'correlation_id', event_id,
        'user_id', auth.uid()::TEXT
      )
    );
  END IF;
  
  -- Publish to Redis Stream via pg_net or external HTTP call
  -- (Implementation depends on infrastructure)
  PERFORM net.http_post(
    url := 'https://your-redis-publisher.com/publish',
    body := event_payload::TEXT,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers
CREATE TRIGGER emit_user_event
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:users');

CREATE TRIGGER emit_campaign_event
  AFTER INSERT OR UPDATE OR DELETE ON fundraisers
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:campaigns');

CREATE TRIGGER emit_org_event
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION publish_to_redis_stream('events:orgs');
```

---

## Idempotency & Retry

### Idempotency Keys
- Each event has a unique `id` field
- Consumers track processed event IDs in Redis:
  ```
  SET processed:events:user.created:evt_123 "1" EX 86400
  ```

### Retry Strategy
- Failed events go to Dead Letter Queue: `dlq:{stream_name}`
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)

### Event Ordering
- Events in the same stream are ordered by timestamp
- Cross-stream ordering not guaranteed (eventual consistency)

---

## Versioning

Events use semantic versioning (`1.0.0`):
- **Major**: Breaking schema change (e.g., remove required field)
- **Minor**: Add optional field (backwards compatible)
- **Patch**: Documentation/metadata change

Consumers must handle multiple versions:
```typescript
switch (event.version) {
  case '1.0.0':
    return handleV1(event);
  case '2.0.0':
    return handleV2(event);
  default:
    throw new Error(`Unsupported event version: ${event.version}`);
}
```

---

## Testing Events

### Unit Tests
```typescript
import { UserCreatedEvent } from './events';

describe('UserCreatedEvent', () => {
  it('should validate payload schema', () => {
    const event = {
      id: 'evt_123',
      type: 'user.created',
      payload: { userId: 'usr_abc', name: 'John' }
    };
    expect(UserCreatedPayloadSchema.parse(event.payload)).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// Publish event → Wait → Assert indexed
await publishEvent({ type: 'campaign.created', payload: {...} });
await sleep(2000); // Wait for indexer
const results = await search('new campaign');
expect(results).toContainEqual({ id: 'cmp_123' });
```

---

## Monitoring

### Metrics
- `events_published_total{type, stream}`
- `events_processed_total{type, consumer}`
- `events_failed_total{type, consumer, reason}`
- `event_processing_lag_seconds{stream}`

### Alerts
- 🚨 **Event lag > 5s** → Consumer is slow
- 🚨 **Failed events > 10/min** → Check DLQ
- ⚠️ **Unknown event type received** → Schema drift
