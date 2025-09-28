/**
 * Enterprise-Grade API Service with advanced features
 * Implements idempotency, money math, rate limiting, cursor pagination, and request management
 */
import { EnterpriseService } from './EnterpriseService';
import { EnterpriseCache } from './EnterpriseCache';
import { EnterpriseSecurity } from './EnterpriseSecurity';
import { RequestContext, ServiceResponse, HealthCheck } from './types';
import { supabase } from '@/integrations/supabase/client';
import { MoneyMath, Money } from './utils/MoneyMath';
import { IdempotencyManager } from './utils/IdempotencyManager';
import { RequestManager } from './utils/RequestManager';
import { CursorPagination, CursorPaginationParams, CursorPaginationResult } from './utils/CursorPagination';
import { RateLimiter } from './utils/RateLimiter';

export interface ApiOptions {
  cache?: {
    key?: string;
    ttl?: number;
    tags?: string[];
    skip?: boolean;
  };
  security?: {
    skipValidation?: boolean;
    skipRateLimit?: boolean;
  };
  validation?: {
    schema?: (data: any) => any;
    skip?: boolean;
  };
  timeout?: number;
  retries?: number;
  idempotencyKey?: string;
  pagination?: CursorPaginationParams;
  userTier?: string;
}

export class EnterpriseApi extends EnterpriseService {
  private cache: EnterpriseCache;
  private security: EnterpriseSecurity;
  private idempotencyManager: IdempotencyManager;
  private requestManager: RequestManager;
  private cursorPagination: CursorPagination;
  private rateLimiter: RateLimiter;

  constructor() {
    super();
    this.cache = new EnterpriseCache();
    this.security = new EnterpriseSecurity();
    this.idempotencyManager = new IdempotencyManager(this.cache);
    this.requestManager = new RequestManager();
    this.cursorPagination = new CursorPagination();
    this.rateLimiter = new RateLimiter(this.cache);
    
    // Set up event forwarding
    this.setupEventHandlers();
  }

  /**
   * Execute database query with enterprise-grade features
   */
  async query<T>(
    queryBuilder: () => any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'QUERY');
    
    return this.requestManager.execute(
      async (signal) => {
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

        return this.executeOperation(
          context,
          async () => {
            // Security validation
            if (!options.security?.skipValidation) {
              const validationResult = await this.security.validateRequest(context);
              if (!validationResult.valid) {
                throw new Error(`Security validation failed: ${validationResult.violations.join(', ')}`);
              }
            }

            // Try cache first
            if (!options.cache?.skip && options.cache?.key) {
              const cached = await this.cache.get<T>(options.cache.key);
              if (cached !== null) {
                return cached;
              }
            }

            // Execute query with pagination support
            let query = queryBuilder();
            if (options.pagination) {
              query = this.cursorPagination.buildQuery(query, options.pagination);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Process pagination results
            let result = data;
            if (options.pagination && Array.isArray(data)) {
              const paginationResult = this.cursorPagination.processResults(data, options.pagination);
              result = paginationResult as any;
            }

            // Cache result
            if (!options.cache?.skip && options.cache?.key) {
              await this.cache.set(
                options.cache.key,
                result,
                {
                  ttl: options.cache.ttl,
                  tags: options.cache.tags
                }
              );
            }

            return result;
          },
          {
            skipCache: options.cache?.skip,
            skipValidation: options.security?.skipValidation,
            skipSecurity: options.security?.skipValidation,
            cacheKey: options.cache?.key,
            cacheTTL: options.cache?.ttl
          }
        );
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
    mutationBuilder: (sanitizedData: any) => any,
    data: any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'MUTATE');
    
    // Generate idempotency key if not provided
    const idempotencyKey = options.idempotencyKey || 
      this.idempotencyManager.generateKey(context.userId || 'anonymous', endpoint, data);

    return this.requestManager.execute(
      async (signal) => {
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

        // Execute with idempotency protection
        return this.idempotencyManager.executeWithIdempotency(
          idempotencyKey,
          async () => {
            return this.executeOperation(
              context,
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

                // Input validation with schema
                if (!options.validation?.skip && options.validation?.schema) {
                  sanitizedData = options.validation.schema(sanitizedData);
                }

                // Process financial data with precise math
                sanitizedData = this.processFinancialData(sanitizedData);

                // Execute mutation
                const mutation = mutationBuilder(sanitizedData);
                const { data: result, error } = await mutation;
                
                if (error) throw error;

                // Invalidate related caches
                if (options.cache?.tags) {
                  for (const tag of options.cache.tags) {
                    await this.cache.invalidateByTag(tag);
                  }
                }

                // Log audit event for mutations
                await this.logAuditEvent(endpoint, 'mutation', result?.id, context, {
                  data: sanitizedData
                });

                return result;
              },
              {
                skipCache: options.cache?.skip,
                skipValidation: options.security?.skipValidation,
                skipSecurity: options.security?.skipValidation,
                cacheKey: options.cache?.key,
                cacheTTL: options.cache?.ttl
              }
            );
          }
        );
      },
      endpoint,
      {
        timeout: options.timeout,
        retries: options.retries,
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
      () => {
        let query = supabase
          .from('fundraisers')
          .select(`
            *,
            categories(name, emoji, color_class),
            profiles(name, avatar),
            public_fundraiser_stats(total_raised, donor_count)
          `)
          .eq('visibility', 'public')
          .eq('status', 'active');

        // Apply filters
        if (params.category) query = query.eq('category_id', params.category);
        if (params.location) query = query.ilike('location', `%${params.location}%`);
        if (params.query) {
          query = query.or(`title.ilike.%${params.query}%,summary.ilike.%${params.query}%`);
        }

        // Apply sorting
        switch (params.sort) {
          case 'popular':
            query = query.order('total_raised', { ascending: false });
            break;
          case 'goal':
            query = query.order('goal_amount', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        if (params.limit) query = query.limit(params.limit);
        if (params.offset) {
          query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
        }

        return query;
      },
      'get_fundraisers',
      {
        cache: {
          key: `fundraisers_${JSON.stringify(params)}`,
          ttl: 300000, // 5 minutes
          tags: ['fundraisers', 'public_data'],
          ...options.cache
        },
        ...options
      }
    );
  }

  async createFundraiser(data: any, options: ApiOptions = {}) {
    return this.mutate(
      (sanitizedData) => {
        return supabase
          .from('fundraisers')
          .insert({
            ...sanitizedData,
            slug: this.generateSlug(sanitizedData.title),
            status: 'draft'
          })
          .select()
          .single();
      },
      data,
      'create_fundraiser',
      {
        cache: {
          tags: ['fundraisers', 'user_data']
        },
        validation: {
          schema: options.validation?.schema
        },
        ...options
      }
    );
  }

  async createDonation(data: any, options: ApiOptions = {}) {
    return this.mutate(
      (sanitizedData) => {
        return supabase
          .from('donations')
          .insert({
            ...sanitizedData,
            net_amount: sanitizedData.amount - (sanitizedData.tip_amount || 0),
            payment_status: 'pending'
          })
          .select()
          .single();
      },
      data,
      'create_donation',
      {
        cache: {
          tags: ['donations', 'fundraiser_stats']
        },
        validation: {
          schema: options.validation?.schema
        },
        ...options
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