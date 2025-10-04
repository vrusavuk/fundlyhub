# Application Architecture

## Overview
This document describes the architecture of the fundraising platform, following clean architecture principles with clear separation of concerns and SOLID design principles.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, Pages, Hooks)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (Business Rules, Domain Events)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (Auth, Query, Mutation, Cache)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (Supabase Client, Database)            │
└─────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation Layer (`src/components/`, `src/pages/`, `src/hooks/`)
**Responsibility**: User interface and interaction

**Rules**:
- Components should be PURE presentation (no business logic)
- Hooks manage UI state and side effects only
- Call services for data operations
- Handle user interactions and display data
- Show loading states, errors, and toasts

**Examples**:
- `LoginForm.tsx` - Renders login UI, calls `authService`
- `FundraiserGrid.tsx` - Displays fundraisers, calls `FundraiserRules` for classification
- `useAuth.tsx` - Manages auth state, subscribes to session changes

**Anti-patterns to avoid**:
- ❌ Business logic in components (e.g., calculating featured status)
- ❌ Direct Supabase calls from components
- ❌ Complex data transformations in render functions
- ❌ Hardcoded business rules (magic numbers)

### 2. Business Logic Layer (`src/lib/business-rules/`)
**Responsibility**: Domain rules and business logic

**Rules**:
- Pure functions with no side effects
- Contains all business rules and calculations
- Independent of UI and data layer
- Highly testable
- All constants defined and documented

**Examples**:
- `FundraiserRules` - Featured/trending classification, urgency calculation
- Business constants (thresholds, limits, rules)

**Anti-patterns to avoid**:
- ❌ Mixing business logic with UI concerns
- ❌ Database calls from business rules
- ❌ Side effects (API calls, state mutations)

### 3. Service Layer (`src/lib/services/`)
**Responsibility**: Application services and orchestration

**Rules**:
- Single Responsibility Principle - each service has ONE job
- Services are stateless (no instance state)
- Handle technical concerns (caching, error handling)
- Coordinate between layers
- Return standardized responses

**Examples**:
- `AuthService` - Authentication operations only
- `QueryService` - Read operations with caching
- `MutationService` - Write operations with cache invalidation
- `CacheService` - Unified caching interface

**Anti-patterns to avoid**:
- ❌ God services (one service doing everything)
- ❌ Services with multiple responsibilities
- ❌ Services managing UI state
- ❌ Duplicate service implementations

### 4. Data Access Layer (`src/integrations/supabase/`)
**Responsibility**: Database and external API communication

**Rules**:
- All database access through Supabase client
- Type-safe queries and mutations
- No business logic
- Return raw data (services transform it)

## Key Design Principles

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each class/service has ONE reason to change
   - `AuthService` - only authentication
   - `QueryService` - only reads
   - `MutationService` - only writes

2. **Open/Closed Principle (OCP)**
   - Services are open for extension, closed for modification
   - Use composition and dependency injection

3. **Liskov Substitution Principle (LSP)**
   - Services can be swapped with compatible implementations
   - Interface-based design

4. **Interface Segregation Principle (ISP)**
   - Small, focused interfaces
   - Services expose only what's needed

5. **Dependency Inversion Principle (DIP)**
   - Depend on abstractions, not concrete implementations
   - Services inject dependencies

### Separation of Concerns

1. **UI Concerns** (Presentation Layer)
   - Rendering
   - User interaction
   - Loading/error states
   - Toasts and notifications

2. **Business Concerns** (Business Logic Layer)
   - Business rules
   - Domain calculations
   - Validation rules
   - Classification logic

3. **Technical Concerns** (Service Layer)
   - Caching
   - Rate limiting
   - Error handling
   - Logging
   - Performance optimization

4. **Data Concerns** (Data Access Layer)
   - Database queries
   - API calls
   - Data persistence

## Data Flow

### Read Operation (Query)
```
User Action → Component → Hook → QueryService → Supabase → Database
                                        ↓
                                  CacheService (check cache)
                                        ↓
                                  BusinessRules (transform)
                                        ↓
                                  Component (display)
```

### Write Operation (Mutation)
```
User Action → Component → Hook → MutationService → Supabase → Database
                                        ↓
                                  Validation
                                        ↓
                                  Cache Invalidation
                                        ↓
                                  Event Publishing
                                        ↓
                                  Component (feedback)
```

## File Organization

```
src/
├── components/           # Presentation layer
│   ├── auth/            # Authentication UI
│   ├── fundraisers/     # Fundraiser UI
│   └── ui/              # Reusable UI components
├── pages/               # Route pages
├── hooks/               # Custom React hooks (UI state only)
├── lib/
│   ├── business-rules/  # Business logic (pure functions)
│   ├── services/        # Application services
│   │   ├── auth.service.ts
│   │   ├── query.service.ts
│   │   ├── mutation.service.ts
│   │   └── cache.service.ts
│   ├── validation/      # Validation schemas
│   └── utils/           # Pure utility functions
└── integrations/
    └── supabase/        # Data access layer
```

## Service Guidelines

### Creating New Services

1. **Identify the responsibility** - What ONE thing does this service do?
2. **Define clear interfaces** - What inputs and outputs?
3. **Keep it stateless** - No instance state, pure operations
4. **Add proper error handling** - Standardized error responses
5. **Document the API** - JSDoc comments for all public methods
6. **Write tests** - Unit tests for business logic

### Service Template
```typescript
/**
 * [Service Name] Service
 * [Description of responsibility]
 * Single Responsibility: [What this service does]
 */

export class [ServiceName]Service {
  /**
   * [Method description]
   * @param data - [Parameter description]
   * @returns Promise with standardized response
   */
  async operation<T>(data: DataType): Promise<ServiceResponse<T>> {
    // Implementation
  }
}

// Export singleton
export const [serviceName]Service = new [ServiceName]Service();
```

## Caching Strategy

### Unified Cache Service
- Single source of truth for all caching
- Based on `EnhancedCache` implementation
- Supports TTL, tags, compression
- Single-flight requests (prevents duplicate calls)
- Stale-while-revalidate pattern

### Cache Keys
```typescript
// Pattern: entity:operation:identifier
'fundraisers:list:active'
'fundraiser:detail:${id}'
'user:profile:${userId}'
```

### Cache Invalidation
```typescript
// By tag
await cacheService.invalidateByTag('fundraisers');

// By pattern
await cacheService.invalidateByPattern('fundraiser:*');
```

## Event System

### Simplified Approach
- Use Supabase Realtime for live updates
- Use React Context for component communication
- Use custom hooks for state management
- Removed: Complex event bus, Redis, hybrid system

### When to Use Events
- ✅ Cross-cutting concerns (analytics, audit logs)
- ✅ Real-time updates (Supabase Realtime)
- ❌ Component-to-component communication (use props/context)
- ❌ State management (use React state/hooks)

## Testing Strategy

### Unit Tests
- Business rules (pure functions)
- Service methods
- Utility functions
- Validation logic

### Integration Tests
- Service + Database
- API endpoints
- Authentication flows

### E2E Tests
- Critical user journeys
- Authentication
- Campaign creation
- Donation flow

## Performance Optimization

1. **Caching**
   - Cache frequently accessed data
   - Use stale-while-revalidate for better UX
   - Invalidate aggressively

2. **Code Splitting**
   - Lazy load routes and components
   - Bundle optimization

3. **Database Queries**
   - Use indexes
   - Limit result sets
   - Pagination

4. **Real-time Updates**
   - Use Supabase Realtime selectively
   - Batch updates when possible

## Security Considerations

1. **Authentication**
   - All protected routes check auth state
   - Session management via Supabase Auth
   - Secure token storage

2. **Authorization**
   - Row Level Security (RLS) policies
   - Permission checks in services
   - Role-based access control

3. **Input Validation**
   - Client-side validation (UX)
   - Server-side validation (security)
   - Use Zod schemas

4. **Data Protection**
   - Sensitive data in environment variables
   - No API keys in client code
   - HTTPS only

## Migration Path

### From Old Architecture
1. ✅ Phase 1: Service Layer - Create focused services
2. ✅ Phase 2: Business Logic - Extract rules from UI
3. ✅ Phase 3: Cache Consolidation - Single cache service
4. ✅ Phase 4: Simplify Events - Remove unused complexity
5. ✅ Phase 5: Documentation - This file

### Remaining Work
- [ ] Add unit tests for business rules
- [ ] Add integration tests for services
- [ ] Delete deprecated files (AdminCache, old API service)
- [ ] Update all components to use new services
- [ ] Add JSDoc comments to all services
- [ ] Performance monitoring and optimization

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [React Best Practices](https://react.dev/learn)
- [Supabase Documentation](https://supabase.com/docs)
