/**
 * Enhanced Enterprise API Service with security, caching, and monitoring
 */
import { apiService, ApiError, RetryConfig, CacheConfig } from './api.service';
import { securityMiddleware, SecurityContext } from '../security/SecurityMiddleware';
import { structuredLogger } from '../monitoring/StructuredLogger';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

export interface ApiRequestOptions {
  retryConfig?: Partial<RetryConfig>;
  cacheConfig?: CacheConfig;
  skipSecurity?: boolean;
  correlationId?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  correlationId: string;
  cached: boolean;
  responseTime: number;
}

class EnhancedApiService {
  private requestCounter = 0;
  private activeRequests = new Map<string, { startTime: number; endpoint: string }>();

  /**
   * Enhanced execute with full enterprise features
   */
  async execute<T>(
    operation: () => Promise<T>,
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const startTime = performance.now();
    
    // Security context
    const securityContext: SecurityContext = {
      requestId: correlationId,
      userId: await this.getCurrentUserId(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      path: endpoint,
      method: 'POST' // Default for API calls
    };

    try {
      // Security checks
      if (!options.skipSecurity) {
        await this.performSecurityChecks(securityContext);
      }

      // Track active request
      this.activeRequests.set(correlationId, { startTime, endpoint });

      // Performance monitoring
      const performanceTracker = performanceMonitor.startRequest(endpoint);

      let result: T;
      let cached = false;

      // Try cache first if configured
      if (options.cacheConfig) {
        try {
          result = await apiService.executeWithCache(
            operation,
            options.cacheConfig,
            options.retryConfig
          );
          cached = true;
        } catch (error) {
          // If cache fails, execute normally
          result = await apiService.executeWithRetry(operation, options.retryConfig);
        }
      } else {
        result = await apiService.executeWithRetry(operation, options.retryConfig);
      }

      const responseTime = performance.now() - startTime;

      // Log successful request
      await structuredLogger.info('API request completed', {
        correlationId,
        operation: endpoint,
        metadata: {
          endpoint,
          responseTime,
          cached
        },
        userId: securityContext.userId
      });

      // Performance tracking
      performanceTracker.end({ success: true, responseTime });

      // Security logging
      await securityMiddleware.logSecurityEvent('api_request_success', {
        endpoint,
        responseTime,
        cached
      }, securityContext);

      return {
        data: result,
        status: 200,
        headers: {},
        correlationId,
        cached,
        responseTime
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // Log error
      await structuredLogger.error('API request failed', error as Error, {
        correlationId,
        operation: endpoint,
        metadata: {
          endpoint,
          responseTime
        },
        userId: securityContext.userId
      });

      // Security logging for failed requests
      await securityMiddleware.logSecurityEvent('api_request_failed', {
        endpoint,
        error: (error as Error).message,
        responseTime
      }, securityContext);

      throw error;
    } finally {
      // Clean up active request tracking
      this.activeRequests.delete(correlationId);
    }
  }

  /**
   * Specialized methods for common operations
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute(
      () => this.makeHttpRequest('GET', endpoint),
      endpoint,
      { ...options, cacheConfig: options?.cacheConfig }
    );
  }

  async post<T>(endpoint: string, data: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute(
      () => this.makeHttpRequest('POST', endpoint, data),
      endpoint,
      options
    );
  }

  async put<T>(endpoint: string, data: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute(
      () => this.makeHttpRequest('PUT', endpoint, data),
      endpoint,
      options
    );
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.execute(
      () => this.makeHttpRequest('DELETE', endpoint),
      endpoint,
      options
    );
  }

  /**
   * Batch operations for better performance
   */
  async batch<T>(
    operations: Array<() => Promise<T>>,
    endpoints: string[],
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T[]>> {
    const correlationId = options?.correlationId || this.generateCorrelationId();
    const startTime = performance.now();

    try {
      const results = await Promise.all(
        operations.map((op, index) => 
          this.execute(op, endpoints[index], { ...options, correlationId })
        )
      );

      const responseTime = performance.now() - startTime;

      return {
        data: results.map(r => r.data),
        status: 200,
        headers: {},
        correlationId,
        cached: results.some(r => r.cached),
        responseTime
      };

    } catch (error) {
      await structuredLogger.error('Batch operation failed', error as Error, {
        correlationId,
        operation: 'batch_operation',
        metadata: {
          endpoints,
          operationCount: operations.length
        }
      });
      throw error;
    }
  }

  /**
   * Get API health and performance metrics
   */
  getMetrics(): {
    activeRequests: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    // This would be enhanced with real metrics collection
    return {
      activeRequests: this.activeRequests.size,
      totalRequests: this.requestCounter,
      averageResponseTime: 0, // Calculate from stored metrics
      errorRate: 0, // Calculate from error logs
      cacheHitRate: 0 // Calculate from cache statistics
    };
  }

  /**
   * Private helper methods
   */
  private async performSecurityChecks(context: SecurityContext): Promise<void> {
    // Rate limiting
    const rateLimitResult = await securityMiddleware.checkRateLimit(
      context.userId || context.ipAddress || 'anonymous'
    );

    if (!rateLimitResult.allowed) {
      throw new ApiError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        429,
        false
      );
    }

    // CSRF validation
    if (!securityMiddleware.validateCsrfToken()) {
      throw new ApiError(
        'CSRF validation failed',
        'CSRF_VALIDATION_FAILED',
        403,
        false
      );
    }
  }

  private async makeHttpRequest(method: string, endpoint: string, data?: any): Promise<any> {
    // This would integrate with your actual HTTP client (fetch, axios, etc.)
    // For now, this is a placeholder that would be replaced with real implementation
    throw new Error('HTTP request implementation needed');
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    // Get current user ID from auth context
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    // In a real implementation, this would get the client IP
    // For browser applications, this might need to be handled server-side
    return undefined;
  }
}

export const enhancedApiService = new EnhancedApiService();