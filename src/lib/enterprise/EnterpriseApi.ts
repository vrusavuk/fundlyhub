/**
 * Refactored Enterprise API Service - Orchestrates all enterprise features
 */
import { EnterpriseService } from './EnterpriseService';
import { EnterpriseCache } from './EnterpriseCache';
import { EnterpriseSecurity } from './EnterpriseSecurity';
import { RequestContext, ServiceResponse, HealthCheck } from './types';
import { supabase } from '@/integrations/supabase/client';

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
}

export class EnterpriseApi extends EnterpriseService {
  private cache: EnterpriseCache;
  private security: EnterpriseSecurity;

  constructor() {
    super();
    this.cache = new EnterpriseCache();
    this.security = new EnterpriseSecurity();
    
    // Set up event forwarding
    this.setupEventHandlers();
  }

  /**
   * Execute database query with full enterprise features
   */
  async query<T>(
    queryBuilder: () => any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'QUERY');
    
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

        // Execute query
        const query = queryBuilder();
        const { data, error } = await query;
        
        if (error) throw error;

        // Cache result
        if (!options.cache?.skip && options.cache?.key) {
          await this.cache.set(
            options.cache.key,
            data,
            {
              ttl: options.cache.ttl,
              tags: options.cache.tags
            }
          );
        }

        return data;
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

  /**
   * Execute mutation with full enterprise features
   */
  async mutate<T>(
    mutationBuilder: (sanitizedData: any) => any,
    data: any,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ServiceResponse<T>> {
    const context = this.createContext(endpoint, 'MUTATE');
    
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