/**
 * Core Types and Interfaces for Enterprise Infrastructure
 */

// Common request/response types
export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  startTime: number;
  scope?: 'global' | 'user' | 'tenant';
}

export interface ServiceResponse<T = any> {
  data: T;
  success: boolean;
  status: number;
  cached?: boolean;
  cacheStatus?: 'fresh' | 'stale' | 'miss' | 'hit';
  responseTime: number;
  correlationId: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  issues: string[];
  timestamp: string;
  metrics: {
    database: {
      latencyP95: number;
      connectionCount: number;
      queryRate: number;
    };
    cache: {
      hitRate: number;
      missRate: number;
      evictionRate: number;
      memoryUsage: number;
    };
    api: {
      requestRate: number;
      errorRate: number;
      averageResponseTime: number;
      p95ResponseTime: number;
    };
    security: {
      blockedRequests: number;
      rateLimitHits: number;
      suspiciousActivity: number;
    };
    circuitBreakers: Record<string, {
      state: 'open' | 'closed' | 'half-open';
      failureCount: number;
      lastFailure?: string;
    }>;
    uptime: {
      seconds: number;
      startTime: string;
    };
    version: string;
  };
}

// Error types
export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  retryable: boolean;
  context?: Record<string, any>;
}

// Metrics types
export interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ServiceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  cache: {
    hitRate: number;
    evictions: number;
    memoryUsage: number;
  };
  security: {
    blockedRequests: number;
    suspiciousActivity: number;
    rateLimitHits: number;
  };
}

// Configuration types
export interface ServiceConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: {
    caching: boolean;
    monitoring: boolean;
    security: boolean;
    validation: boolean;
    idempotency: boolean;
    rateLimiting: boolean;
    preciseMoneyMath: boolean;
    cursorPagination: boolean;
  };
  limits: {
    requestSize: number;
    cacheSize: number;
    rateLimitWindow: number;
    rateLimitRequests: number;
    maxRetries: number;
    requestTimeout: number;
    idempotencyTtl: number;
  };
}

// Event types
export interface ServiceEvent {
  type: string;
  payload: Record<string, any>;
  context: RequestContext;
  timestamp: number;
}

export interface AuditEvent extends ServiceEvent {
  type: 'audit';
  payload: {
    action: string;
    resourceType: string;
    resourceId?: string;
    userId?: string;
    changes?: Record<string, any>;
  };
}

export interface SecurityEvent extends ServiceEvent {
  type: 'security';
  payload: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    blocked: boolean;
    details: Record<string, any>;
  };
}

export interface PerformanceEvent extends ServiceEvent {
  type: 'performance';
  payload: {
    operation: string;
    duration: number;
    grade: 'excellent' | 'good' | 'acceptable' | 'poor';
    metadata: Record<string, any>;
  };
}

// Batch operation types
export interface BatchOperation<T = any> {
  type: 'query' | 'mutation';
  id: string;
  operation: () => Promise<T>;
  data?: any;
  context?: Partial<RequestContext>;
  options?: {
    continueOnError?: boolean;
    idempotencyKey?: string;
  };
}

export interface BatchResult<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: Error;
}

export interface BatchResponse<T = any> {
  results: BatchResult<T>[];
  successCount: number;
  errorCount: number;
  totalTime: number;
  partialSuccess: boolean;
}