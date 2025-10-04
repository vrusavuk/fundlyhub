# Security Guidelines

## Critical Security Rules

### 1. Authorization & Access Control

**❌ NEVER use `profiles.role` for authorization decisions**

The `role` column in the `profiles` table is **for display purposes only**. Using it for authorization creates a critical security vulnerability.

```typescript
// ❌ WRONG - Security vulnerability!
if (profile.role === 'admin') {
  // Allow admin action
}

// ✅ CORRECT - Use RBAC system
const { hasPermission } = useRBAC();
if (hasPermission('manage_users')) {
  // Allow admin action
}
```

**Always use the RBAC (Role-Based Access Control) system:**

```typescript
import { useRBAC } from '@/hooks/useRBAC';

function MyComponent() {
  const { hasPermission, hasRole, isSuperAdmin } = useRBAC();
  
  // Check specific permissions
  if (hasPermission('manage_campaigns')) {
    // User has permission
  }
  
  // Check for specific role
  if (hasRole('platform_admin', 'global')) {
    // User has role
  }
  
  // Check if super admin
  if (isSuperAdmin()) {
    // User is super admin
  }
}
```

### 2. Database Access Patterns

**✅ Use secure functions and views:**

#### User Profiles
```typescript
// For own profile (includes sensitive data like email)
const { data } = await supabase.rpc('get_my_complete_profile');

// For other users (public data only)
const { data } = await supabase
  .from('public_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Organizations
```typescript
// For public organization info (no sensitive financial data)
const { data } = await supabase
  .rpc('get_public_organization_info', { org_id: organizationId });

// Full organization details only accessible to members
// RLS policies enforce this automatically
```

#### Donations with Privacy
```typescript
// Always use the privacy-respecting view
const { data } = await supabase
  .from('donations_with_privacy')
  .select('*')
  .eq('fundraiser_id', fundraiserId);

// This view automatically:
// - Hides donor info for anonymous donations
// - Shows donor info only to authorized users
// - Respects user privacy preferences
```

### 3. Data Privacy Rules

**Sensitive Data Fields:**
- Email addresses
- Phone numbers
- Tax IDs (EIN)
- Payment provider IDs (Stripe, PayPal)
- Failed login attempts
- Account lock status

**These fields must NEVER be exposed in:**
- Public API endpoints
- Public database views
- Client-side code without proper authorization
- Error messages or logs

### 4. Anonymous Donations

Always respect the `is_anonymous` flag on donations:

```typescript
// When displaying donations
{donations.map(donation => {
  const donorName = donation.is_anonymous 
    ? 'Anonymous' 
    : donation.donor_name;
  // ...
})}
```

The `donations_with_privacy` view handles this automatically.

### 5. Row Level Security (RLS)

All tables with user data **must** have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (
  -- Only allow specific access patterns
  auth.uid() = user_id
);
```

**Key RLS principles:**
- Default deny - no access unless explicitly granted
- Use security definer functions for complex checks
- Test policies with different user contexts
- Never use `OR true` in policies (creates public access)

### 6. Input Validation & XSS Prevention

**Never trust client input:**

```typescript
// ❌ WRONG - No validation
await supabase.from('donations').insert({ amount: userInput });

// ✅ CORRECT - Validate first
const schema = z.object({
  amount: z.number().positive().max(1000000),
  fundraiser_id: z.string().uuid()
});

const validated = schema.parse(userInput);
await supabase.from('donations').insert(validated);
```

**Always sanitize HTML content:**

```typescript
// ❌ WRONG - XSS vulnerability!
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ CORRECT - Use DOMPurify
import { sanitizeHTML } from '@/lib/utils/sanitize';

<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />

// ✅ EVEN BETTER - Use the component
import { SecureHtmlRenderer } from '@/lib/security/SecureHtmlRenderer';

<SecureHtmlRenderer html={userContent} className="prose" />
```

### 7. Authentication State

**Never store sensitive auth state in localStorage:**

```typescript
// ❌ WRONG - Can be manipulated
localStorage.setItem('isAdmin', 'true');

// ✅ CORRECT - Use server-side session
const { data: { user } } = await supabase.auth.getUser();
const { hasPermission } = useRBAC();
```

## Security Checklist for New Features

- [ ] All database tables have RLS enabled
- [ ] RLS policies are restrictive (default deny)
- [ ] No sensitive data (email, phone, PII) exposed in public views
- [ ] Authorization uses RBAC, not profile.role
- [ ] Input validation with Zod schemas
- [ ] HTML content sanitized with DOMPurify
- [ ] Anonymous donations respected
- [ ] No hardcoded credentials or API keys
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging for sensitive operations
- [ ] Donations require authentication
- [ ] beneficiary_contact never exposed in public queries

## Database Security Functions

These functions are available for secure operations:

- `get_my_complete_profile()` - Get own profile with sensitive data
- `get_my_permissions()` - Get own permissions without exposing security architecture
- `get_public_organization_info(org_id)` - Get public org info only
- `get_public_fundraiser(slug)` - Get fundraiser WITHOUT beneficiary_contact
- `user_has_permission(user_id, permission)` - Check permissions
- `has_role(user_id, role)` - Check role assignment
- `is_super_admin(user_id)` - Check super admin status
- `log_audit_event(...)` - Log security events
- `log_failed_donation_attempt(fundraiser_id, reason)` - Log failed donations

## Secure Views

Always use these views instead of querying tables directly:

- `public_profiles` - User profiles WITHOUT email or security fields
- `public_organizations` - Organizations WITHOUT EIN, payment IDs, addresses
- `donations_with_privacy` - Donations respecting is_anonymous flag
- `public_fundraiser_stats` - Aggregated stats safe for public access

## Restricted Access Tables

**NEVER query these tables directly in client code:**

❌ **DO NOT** query `role_permissions`, `permissions`, `roles` tables directly
- These expose your security architecture to attackers
- Use `get_my_permissions()` function instead for user permissions
- Admin interfaces only: require `manage_user_roles` permission

❌ **DO NOT** allow unauthenticated writes to `categories`
- Public read access for active categories only
- Write operations require `manage_system_settings` permission

❌ **DO NOT** expose organization membership publicly
- Only organization members can view membership
- Only owners/admins can add/modify members

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Contact the security team immediately
3. Provide detailed reproduction steps
4. Wait for acknowledgment before disclosure

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
