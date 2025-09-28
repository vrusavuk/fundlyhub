/**
 * Enterprise-Grade API Service with advanced features
 * Implements idempotency, money math, rate limiting, cursor pagination, and request management
 */
import { EnterpriseService } from './EnterpriseService';
import { EnterpriseSecurity } from './EnterpriseSecurity';
import { RequestContext, ServiceResponse, HealthCheck } from './types';
import { supabase } from '@/integrations/supabase/client';
import { MoneyMath, Money } from './utils/MoneyMath';
import { IdempotencyManager } from './utils/IdempotencyManager';
import { RequestManager } from './utils/RequestManager';
import { CursorPagination, CursorPaginationParams, CursorPaginationResult } from './utils/CursorPagination';
import { RateLimiter } from './utils/RateLimiter';
import { AbortableSupabase } from './utils/AbortableSupabase';
import { EnhancedCache, SingleFlightOptions } from './utils/EnhancedCache';
import { SecureSearch, SearchOptions, SearchConfig } from './utils/SecureSearch';
import { ValidationEngine, ValidationResult } from './utils/ValidationEngine';

export interface ApiOptions {
  cache?: SingleFlightOptions & {
    key?: string;
    skip?: boolean;
    staleWhileRevalidate?: boolean;
    staleTime?: number;
  };
  security?: {
    skipValidation?: boolean;
    skipRateLimit?: boolean;
  };
  validation?: {
    schema?: any;
    asyncValidators?: Array<(data: any) => Promise<ValidationResult<any>>>;
    async?: boolean;
    skip?: boolean;
  };
  timeout?: number;
  retries?: number;
  idempotencyKey?: string;
  pagination?: CursorPaginationParams;
  userTier?: string;
  userId?: string;
  tenantId?: string;
  search?: SearchOptions;
}

export class EnterpriseApi extends EnterpriseService {
  protected cache: EnhancedCache;
  protected security: EnterpriseSecurity;
  protected idempotencyManager: IdempotencyManager;
  protected requestManager: RequestManager;
  protected cursorPagination: CursorPagination;
  protected rateLimiter: RateLimiter;
  protected abortableSupabase: AbortableSupabase;

  constructor() {
    super();
    this.cache = new EnhancedCache();
    this.security = new EnterpriseSecurity();
    this.idempotencyManager = new IdempotencyManager(this.cache as any);
    this.requestManager = new RequestManager();
    this.cursorPagination = new CursorPagination();
    this.rateLimiter = new RateLimiter(this.cache as any);
    this.abortableSupabase = new AbortableSupabase();
    
    // Set up event forwarding
    this.setupEventHandlers();
  }

  /**
   * Execute database query with enterprise-grade features
   */
  async query<T>(
    queryBuilder: (sb: any) => any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'QUERY');
    context.userId = options.userId || context.userId;
    
    return this.requestManager.execute(
      async (signal) => {
        // Use abortable Supabase with signal
        const sb = this.abortableSupabase.withSignal(signal);
        
        // Rate limiting check
        if (!options.security?.skipRateLimit) {
          const rateLimitKey = this.rateLimiter.generateKey(context);
          const userTier = this.rateLimiter.getUserTier({
            userId: context.userId,
            isAuthenticated: !!context.userId
          });
          
          const rateLimit = await this.rateLimiter.checkRateLimit(rateLimitKey, userTier, endpoint);
          if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`);
          }
        }

        // Create scoped cache key
        const scope = options.tenantId ? `t:${options.tenantId}` : 
                      context.userId ? `u:${context.userId}` : 'public';
        const scopedCacheKey = options.cache?.key ? `${scope}:${options.cache.key}` : undefined;

        const runQuery = async () => {
          // Security validation
          if (!options.security?.skipValidation) {
            const validationResult = await this.security.validateRequest(context);
            if (!validationResult.valid) {
              throw new Error(`Security validation failed: ${validationResult.violations.join(', ')}`);
            }
          }

          // Execute query with pagination support
          let query = queryBuilder(sb);
          if (options.pagination) {
            query = this.cursorPagination.buildQuery(query, options.pagination);
          }

          const { data, error } = await query;
          if (error) throw error;

          // Process pagination results
          return options.pagination && Array.isArray(data)
            ? this.cursorPagination.processResults(data, options.pagination)
            : data;
        };

        // Use single-flight caching with stale-while-revalidate
        if (scopedCacheKey && !options.cache?.skip) {
          return this.cache.staleWhileRevalidate(
            scopedCacheKey,
            runQuery,
            {
              ttl: options.cache.ttl || 300000, // 5 minutes default
              tags: options.cache.tags || [],
              staleTime: options.cache.staleTime || 60000, // 1 minute stale time
              scope: options.tenantId ? 'tenant' : context.userId ? 'user' : 'public',
              userId: context.userId,
              tenantId: options.tenantId
            }
          );
        }

        return runQuery();
      },
      endpoint,
      {
        timeout: options.timeout,
        retries: options.retries,
        deduplicationKey: options.cache?.key
      }
    );
  }

  /**
   * Execute mutation with enterprise-grade features including idempotency
   */
  async mutate<T>(
    mutationBuilder: (sanitizedData: any, sb: any) => any,
    data: any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'MUTATE');
    context.userId = options.userId || context.userId;
    
    // Generate idempotency key if not provided
    const idempotencyKey = options.idempotencyKey || 
      this.idempotencyManager.generateKey(context.userId || 'anonymous', endpoint, data);

    return this.requestManager.execute(
      async (signal) => {
        // Use abortable Supabase with signal
        const sb = this.abortableSupabase.withSignal(signal);
        
        // Rate limiting check
        if (!options.security?.skipRateLimit) {
          const rateLimitKey = this.rateLimiter.generateKey(context);
          const userTier = this.rateLimiter.getUserTier({
            userId: context.userId,
            isAuthenticated: !!context.userId
          });
          
          const rateLimit = await this.rateLimiter.consumeRequest(rateLimitKey, userTier, endpoint);
          if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`);
          }
        }

        let auditOutcome = 'error';
        let auditMetadata: any = {};

        try {
          // Execute with idempotency protection
          const result = await this.idempotencyManager.executeWithIdempotency(
            idempotencyKey,
            async () => {
              // Security validation and sanitization
              let sanitizedData = data;
              if (!options.security?.skipValidation) {
                const validationResult = await this.security.validateRequest(context, data);
                if (!validationResult.valid) {
                  throw new Error(`Security validation failed: ${validationResult.violations.join(', ')}`);
                }
                sanitizedData = validationResult.sanitizedData;
              }

              // Enhanced validation with ValidationEngine
              if (!options.validation?.skip && options.validation?.schema) {
                const validationResult = await ValidationEngine.validate(sanitizedData, {
                  schema: options.validation.schema,
                  asyncValidators: options.validation.asyncValidators
                });
                
                if (!validationResult.valid) {
                  throw new Error(`Validation failed: ${validationResult.errors?.map(e => e.message).join(', ')}`);
                }
                
                sanitizedData = validationResult.data;
              }

              // Process financial data with precise math
              sanitizedData = this.processFinancialData(sanitizedData);

              // Execute mutation
              const mutation = mutationBuilder(sanitizedData, sb);
              const { data: result, error } = await mutation;
              
              if (error) throw error;

              // Invalidate related caches concurrently
              if (options.cache?.tags) {
                await this.cache.invalidateByTags(options.cache.tags);
              }

              return result;
            }
          );

          auditOutcome = 'success';
          auditMetadata = { endpoint, outcome: 'success', resourceId: result?.id };
          
          return this.createResponse(context, result as T, false, auditMetadata);
        } catch (error) {
          auditMetadata = { 
            endpoint, 
            outcome: 'error', 
            error: (error as Error).message,
            code: (error as any).code || 'UNKNOWN'
          };
          
          throw error;
        } finally {
          // Always log audit event
          try {
            await this.logAuditEvent('mutation', 'resource', auditMetadata.resourceId || undefined, context, auditMetadata);
          } catch (auditError) {
            console.error('Audit logging failed:', auditError);
          }
        }
      },
      endpoint,
      {
        timeout: options.timeout,
        retries: options.idempotencyKey ? options.retries : 0, // No retries without idempotency
        deduplicationKey: idempotencyKey
      }
    );
  }

  /**
   * Batch operations
   */
  async batch<T>(
    operations: Array<{
      type: 'query' | 'mutate';
      builder: () => any;
      endpoint: string;
      options?: ApiOptions;
    }>
  ): Promise<ServiceResponse<any[]>> {
    const context = this.createContext('batch', 'BATCH');
    
    return this.executeOperation(
      context,
      async () => {
        const results = await Promise.all(
          operations.map(async (op) => {
            if (op.type === 'query') {
              return this.query(op.builder, op.endpoint, op.options);
            } else {
              return this.mutate(op.builder, {}, op.endpoint, op.options);
            }
          })
        );

        return results.map(r => r.data);
      },
      {
        skipCache: true,
        skipValidation: false,
        skipSecurity: false
      }
    );
  }

  /**
   * Specialized fundraiser operations
   */
  async getFundraisers(params: any = {}, options: ApiOptions = {}) {
    return this.query(
      (sb) => {
        let query = sb
          .from('fundraisers')
          .select(`
            id,
            title,
            summary,
            goal_amount,
            total_raised,
            currency,
            status,
            visibility,
            created_at,
            updated_at,
            owner_user_id,
            category_id,
            location,
            tags,
            categories(name, emoji, color_class),
            profiles(name, avatar_url)
          `)
          .eq('visibility', 'public')
          .eq('status', 'active');

        // Apply secure filters
        if (params.category) {
          query = query.eq('category_id', params.category);
        }
        
        if (params.location) {
          query = SecureSearch.applyILike(query, 'location', params.location);
        }
        
        if (params.query) {
          // Use secure FTS instead of raw ILIKE
          query = SecureSearch.applyFTS(query, 'fts', params.query);
        }

        // Apply sorting
        if (params.sort === 'popular') {
          query = query.order('total_raised', { ascending: false });
        } else if (params.sort === 'goal') {
          query = query.order('goal_amount', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        return query;
      },
      'get_fundraisers',
      {
        ...options,
        pagination: options.pagination || {
          limit: params.limit || 10,
          cursor: params.cursor
        },
        cache: {
          key: `fundraisers_${JSON.stringify(params)}`,
          ttl: 300000, // 5 minutes
          tags: ['fundraisers', 'public_data'],
          staleTime: 60000, // 1 minute stale time
          ...options.cache
        }
      }
    );
  }

  async createFundraiser(data: any, options: ApiOptions = {}) {
    return this.mutate(
      (sanitizedData, sb) => {
        const slug = this.generateSlug(sanitizedData.title) + '-' + Date.now();
        return sb
          .from('fundraisers')
          .insert({
            ...sanitizedData,
            status: 'pending',
            visibility: 'public',
            slug
          })
          .select()
          .single();
      },
      data,
      'create_fundraiser',
      {
        ...options,
        idempotencyKey: options.idempotencyKey || `fundraiser_${data.title}_${Date.now()}`,
        cache: {
          tags: ['fundraisers', 'user_campaigns'],
          ...options.cache
        }
      }
    );
  }

  async createDonation(data: any, options: ApiOptions = {}) {
    const toCents = (amount: number | string) => Math.round(Number(amount) * 100);
    
    return this.mutate(
      (sanitizedData, sb) => {
        const amountCents = toCents(sanitizedData.amount);
        const tipCents = toCents(sanitizedData.tip_amount || 0);
        const netCents = amountCents - tipCents;
        
        if (tipCents > amountCents) {
          throw new Error('Tip amount cannot exceed donation amount');
        }
        
        return sb
          .from('donations')
          .insert({
            fundraiser_id: sanitizedData.fundraiser_id,
            donor_id: sanitizedData.donor_id,
            amount_cents: amountCents,
            tip_cents: tipCents,
            net_cents: netCents,
            currency: sanitizedData.currency || 'USD',
            payment_status: 'pending',
            payment_method: sanitizedData.payment_method,
            donor_name: sanitizedData.donor_name,
            donor_email: sanitizedData.donor_email,
            message: sanitizedData.message,
            is_anonymous: sanitizedData.is_anonymous || false
          })
          .select()
          .single();
      },
      data,
      'create_donation',
      {
        ...options,
        idempotencyKey: options.idempotencyKey || `donation_${data.fundraiser_id}_${Date.now()}`,
        cache: {
          tags: ['donations', 'fundraiser_stats'],
          ...options.cache
        }
      }
    );
  }

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<HealthCheck> {
    const [cacheHealth, securityHealth] = await Promise.all([
      this.cache.healthCheck(),
      this.security.healthCheck()
    ]);

    const dbCheck = await this.checkDatabaseHealth();
    
    const allChecks = {
      database: dbCheck,
      cache: cacheHealth.status !== 'unhealthy',
      security: securityHealth.status !== 'unhealthy'
    };

    const allIssues = [
      ...(dbCheck ? [] : ['Database connection failed']),
      ...cacheHealth.issues,
      ...securityHealth.issues
    ];

    const allHealthy = Object.values(allChecks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : (allIssues.length > 2 ? 'unhealthy' : 'degraded'),
      checks: allChecks,
      issues: allIssues,
      timestamp: new Date().toISOString(),
      metrics: {
        cache: cacheHealth.metrics,
        security: securityHealth.metrics
      }
    };
  }

  /**
   * Money math utilities
   */
  createMoney(amount: number | string, currency: string = 'USD'): Money {
    return MoneyMath.create(amount, currency);
  }

  formatMoney(money: Money, locale?: string): string {
    return MoneyMath.format(money, locale);
  }

  calculateTip(amount: Money, tipPercent: number): Money {
    return MoneyMath.percentage(amount, tipPercent);
  }

  calculateNetAmount(grossAmount: Money, fees: Money[]): Money {
    return fees.reduce((net, fee) => MoneyMath.subtract(net, fee), grossAmount);
  }

  /**
   * Cursor pagination utilities
   */
  async queryWithPagination<T>(
    queryBuilder: () => any,
    endpoint: string,
    paginationParams: CursorPaginationParams,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<CursorPaginationResult<T>>> {
    const response = await this.query(
      queryBuilder,
      endpoint,
      {
        ...options,
        pagination: paginationParams
      }
    );

    return response as ServiceResponse<CursorPaginationResult<T>>;
  }

  /**
   * Rate limiting utilities
   */
  async checkUserRateLimit(context: RequestContext, endpoint: string): Promise<boolean> {
    const rateLimitKey = this.rateLimiter.generateKey(context);
    const userTier = this.rateLimiter.getUserTier({
      userId: context.userId,
      isAuthenticated: !!context.userId
    });
    
    const result = await this.rateLimiter.checkRateLimit(rateLimitKey, userTier, endpoint);
    return result.allowed;
  }

  /**
   * Process financial data with precise money math
   */
  private processFinancialData(data: any): any {
    const processed = { ...data };

    // Convert monetary fields to precise Money objects for calculations
    if (processed.amount && processed.currency) {
      const money = this.createMoney(processed.amount, processed.currency);
      processed.amount = MoneyMath.toNumber(money); // Store as number for database
      processed._preciseAmount = money; // Keep precise version for calculations
    }

    if (processed.goal_amount && processed.currency) {
      const goalMoney = this.createMoney(processed.goal_amount, processed.currency);
      processed.goal_amount = MoneyMath.toNumber(goalMoney);
      processed._preciseGoal = goalMoney;
    }

    if (processed.tip_amount && processed.currency) {
      const tipMoney = this.createMoney(processed.tip_amount, processed.currency);
      processed.tip_amount = MoneyMath.toNumber(tipMoney);
      processed._preciseTip = tipMoney;
    }

    // Calculate net amount for donations
    if (processed._preciseAmount && processed._preciseTip) {
      const netAmount = MoneyMath.subtract(processed._preciseAmount, processed._preciseTip);
      processed.net_amount = MoneyMath.toNumber(netAmount);
    }

    return processed;
  }

  /**
   * Private helper methods
   */
  private setupEventHandlers(): void {
    // Forward cache events
    this.cache.on('error', (event) => this.emit(event));
    this.cache.on('cache_set', (event) => this.emit(event));
    this.cache.on('cache_evict', (event) => this.emit(event));

    // Forward security events
    this.security.on('security', (event) => this.emit(event));
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  private async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string | undefined,
    context: RequestContext,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.rpc('log_audit_event', {
        _actor_id: context.userId || null,
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _metadata: metadata,
        _ip_address: context.ipAddress || null,
        _user_agent: context.userAgent || null
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}

export const enterpriseApi = new EnterpriseApi();