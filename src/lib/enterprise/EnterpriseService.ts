/**
 * Enterprise Service Base Class - Common functionality for all services
 */
import { 
  RequestContext, 
  ServiceResponse, 
  ServiceError, 
  ServiceConfig, 
  ServiceEvent,
  HealthCheck 
} from './types';

export abstract class EnterpriseService {
  protected config: ServiceConfig;
  protected eventHandlers = new Map<string, Array<(event: ServiceEvent) => void>>();
  
  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      environment: 'development',
      version: '1.0.0',
      features: {
        caching: true,
        monitoring: true,
        security: true,
        validation: true,
        idempotency: true,
        rateLimiting: true,
        preciseMoneyMath: true,
        cursorPagination: true
      },
      limits: {
        requestSize: 10485760, // 10MB
        cacheSize: 10000,
        rateLimitWindow: 60000, // 1 minute
        rateLimitRequests: 100,
        maxRetries: 3,
        requestTimeout: 30000, // 30 seconds
        idempotencyTtl: 86400000 // 24 hours
      },
      ...config
    };
  }

  /**
   * Create standardized request context
   */
  protected createContext(endpoint?: string, method?: string): RequestContext {
    return {
      requestId: this.generateId(),
      endpoint,
      method,
      startTime: performance.now(),
      // Additional context would be populated by middleware
    };
  }

  /**
   * Create standardized service response
   */
  protected createResponse<T>(
    context: RequestContext,
    data: T,
    cached = false,
    metadata?: Record<string, any>
  ): ServiceResponse<T> {
    return {
      data,
      success: true,
      status: 200,
      cached,
      responseTime: performance.now() - context.startTime,
      correlationId: context.requestId,
      metadata
    };
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse(
    context: RequestContext,
    error: Error,
    statusCode = 500
  ): ServiceResponse<null> {
    return {
      data: null,
      success: false,
      status: statusCode,
      responseTime: performance.now() - context.startTime,
      correlationId: context.requestId,
      metadata: {
        error: {
          message: error.message,
          name: error.name,
          code: (error as ServiceError).code
        }
      }
    };
  }

  /**
   * Event emission system
   */
  protected emit(event: ServiceEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Event handler failed for ${event.type}:`, error);
      }
    });
  }

  /**
   * Event subscription
   */
  public on(eventType: string, handler: (event: ServiceEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Execute operation with full enterprise features
   */
  protected async executeOperation<T>(
    context: RequestContext,
    operation: () => Promise<T>,
    options: {
      skipCache?: boolean;
      skipValidation?: boolean;
      skipSecurity?: boolean;
      cacheKey?: string;
      cacheTTL?: number;
    } = {}
  ): Promise<ServiceResponse<T>> {
    try {
      // Pre-execution hooks
      await this.beforeOperation(context, options);
      
      // Execute the operation
      const result = await operation();
      
      // Post-execution hooks
      await this.afterOperation(context, result, options);
      
      return this.createResponse(context, result, false);
      
    } catch (error) {
      await this.onOperationError(context, error as Error, options);
      throw error;
    }
  }

  /**
   * Hook methods for subclasses to override
   */
  protected async beforeOperation(
    context: RequestContext, 
    options: any
  ): Promise<void> {
    // Override in subclasses
  }

  protected async afterOperation(
    context: RequestContext, 
    result: any, 
    options: any
  ): Promise<void> {
    // Override in subclasses
  }

  protected async onOperationError(
    context: RequestContext, 
    error: Error, 
    options: any
  ): Promise<void> {
    // Override in subclasses
  }

  /**
   * Abstract methods that must be implemented
   */
  public abstract healthCheck(): Promise<HealthCheck>;

  /**
   * Utility methods
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected isProduction(): boolean {
    return this.config.environment === 'production';
  }

  protected isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  protected getFeatureFlag(feature: keyof ServiceConfig['features']): boolean {
    return this.config.features[feature];
  }

  protected getLimit(limit: keyof ServiceConfig['limits']): number {
    return this.config.limits[limit];
  }
}