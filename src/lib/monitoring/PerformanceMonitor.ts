/**
 * Enterprise Performance Monitoring System
 */
import { structuredLogger } from './StructuredLogger';

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  memoryUsage: number;
  cacheHitRate: number;
  dbQueryTime: number;
  slowQueries: number;
}

export interface RequestTracker {
  startTime: number;
  endTime?: number;
  endpoint: string;
  success?: boolean;
  responseTime?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private activeRequests = new Map<string, RequestTracker>();
  private completedRequests: RequestTracker[] = [];
  private maxHistorySize = 1000;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
  }

  /**
   * Start tracking a request
   */
  startRequest(endpoint: string, metadata?: Record<string, any>): {
    end: (result: { success: boolean; responseTime?: number }) => void;
  } {
    const requestId = this.generateRequestId();
    const tracker: RequestTracker = {
      startTime: performance.now(),
      endpoint,
      metadata
    };

    this.activeRequests.set(requestId, tracker);

    return {
      end: (result) => this.endRequest(requestId, result)
    };
  }

  /**
   * End request tracking
   */
  private endRequest(
    requestId: string, 
    result: { success: boolean; responseTime?: number }
  ): void {
    const tracker = this.activeRequests.get(requestId);
    if (!tracker) return;

    const endTime = performance.now();
    const responseTime = result.responseTime || (endTime - tracker.startTime);

    tracker.endTime = endTime;
    tracker.success = result.success;
    tracker.responseTime = responseTime;

    // Move to completed requests
    this.activeRequests.delete(requestId);
    this.completedRequests.push(tracker);

    // Maintain history size
    if (this.completedRequests.length > this.maxHistorySize) {
      this.completedRequests.shift();
    }

    // Log slow requests
    if (responseTime > 1000) { // > 1 second
      structuredLogger.performance(
        `Slow request: ${tracker.endpoint}`,
        responseTime,
        {
          metadata: tracker.metadata,
          tags: ['slow-request']
        }
      );
    }

    // Log failed requests
    if (!result.success) {
      structuredLogger.warn(
        `Failed request: ${tracker.endpoint}`,
        {
          metadata: { ...tracker.metadata, responseTime },
          tags: ['failed-request']
        }
      );
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const recent = this.getRecentRequests(60000); // Last minute
    const total = recent.length;
    
    if (total === 0) {
      return {
        requestCount: 0,
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: this.getMemoryUsage(),
        cacheHitRate: 0,
        dbQueryTime: 0,
        slowQueries: 0
      };
    }

    const totalResponseTime = recent.reduce((sum, req) => sum + (req.responseTime || 0), 0);
    const failedRequests = recent.filter(req => !req.success).length;
    const slowRequests = recent.filter(req => (req.responseTime || 0) > 1000).length;

    return {
      requestCount: total,
      averageResponseTime: totalResponseTime / total,
      errorRate: (failedRequests / total) * 100,
      throughput: total / 60, // per second in last minute
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: this.calculateCacheHitRate(recent),
      dbQueryTime: this.calculateDbQueryTime(recent),
      slowQueries: slowRequests
    };
  }

  /**
   * Get performance alerts
   */
  getAlerts(): Array<{
    type: 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
  }> {
    const metrics = this.getMetrics();
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }> = [];

    // Response time alerts
    if (metrics.averageResponseTime > 2000) {
      alerts.push({
        type: 'critical',
        message: 'Average response time is critically high',
        value: metrics.averageResponseTime,
        threshold: 2000
      });
    } else if (metrics.averageResponseTime > 1000) {
      alerts.push({
        type: 'warning',
        message: 'Average response time is elevated',
        value: metrics.averageResponseTime,
        threshold: 1000
      });
    }

    // Error rate alerts
    if (metrics.errorRate > 10) {
      alerts.push({
        type: 'critical',
        message: 'Error rate is critically high',
        value: metrics.errorRate,
        threshold: 10
      });
    } else if (metrics.errorRate > 5) {
      alerts.push({
        type: 'warning',
        message: 'Error rate is elevated',
        value: metrics.errorRate,
        threshold: 5
      });
    }

    // Memory usage alerts
    if (metrics.memoryUsage > 90) {
      alerts.push({
        type: 'critical',
        message: 'Memory usage is critically high',
        value: metrics.memoryUsage,
        threshold: 90
      });
    } else if (metrics.memoryUsage > 75) {
      alerts.push({
        type: 'warning',
        message: 'Memory usage is elevated',
        value: metrics.memoryUsage,
        threshold: 75
      });
    }

    return alerts;
  }

  /**
   * Get detailed request analytics
   */
  getRequestAnalytics(timeframe: number = 3600000): {
    byEndpoint: Record<string, {
      count: number;
      averageTime: number;
      errorRate: number;
    }>;
    hourlyDistribution: Array<{
      hour: string;
      requests: number;
      errors: number;
      averageTime: number;
    }>;
  } {
    const recent = this.getRecentRequests(timeframe);
    
    // Group by endpoint
    const byEndpoint: Record<string, {
      count: number;
      totalTime: number;
      errors: number;
    }> = {};

    recent.forEach(req => {
      if (!byEndpoint[req.endpoint]) {
        byEndpoint[req.endpoint] = { count: 0, totalTime: 0, errors: 0 };
      }
      
      byEndpoint[req.endpoint].count++;
      byEndpoint[req.endpoint].totalTime += req.responseTime || 0;
      if (!req.success) byEndpoint[req.endpoint].errors++;
    });

    // Convert to final format
    const endpointStats: Record<string, {
      count: number;
      averageTime: number;
      errorRate: number;
    }> = {};

    Object.entries(byEndpoint).forEach(([endpoint, stats]) => {
      endpointStats[endpoint] = {
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
        errorRate: (stats.errors / stats.count) * 100
      };
    });

    // Hourly distribution (simplified)
    const hourlyDistribution = this.calculateHourlyDistribution(recent);

    return {
      byEndpoint: endpointStats,
      hourlyDistribution
    };
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: PerformanceMetrics;
  }> {
    const metrics = this.getMetrics();
    const alerts = this.getAlerts();
    
    const checks = {
      responseTime: metrics.averageResponseTime < 1000,
      errorRate: metrics.errorRate < 5,
      memoryUsage: metrics.memoryUsage < 80,
      activeRequests: this.activeRequests.size < 100
    };

    const failedChecks = Object.values(checks).filter(check => !check).length;
    const criticalAlerts = alerts.filter(alert => alert.type === 'critical').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (criticalAlerts > 0 || failedChecks > 2) {
      status = 'unhealthy';
    } else if (failedChecks > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      checks,
      metrics
    };
  }

  /**
   * Private helper methods
   */
  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            structuredLogger.performance(
              'Page navigation',
              entry.duration,
              {
                metadata: {
                  type: 'navigation',
                  name: entry.name,
                  startTime: entry.startTime
                }
              }
            );
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource'] });
    }
  }

  private startMemoryMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > 80) {
        structuredLogger.warn(`High memory usage: ${memoryUsage}%`, {
          metadata: { memoryUsage },
          tags: ['memory', 'performance']
        });
      }
    }, 30000);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
    }
    return 0;
  }

  private getRecentRequests(timeframe: number): RequestTracker[] {
    const cutoff = Date.now() - timeframe;
    return this.completedRequests.filter(req => 
      req.endTime && req.endTime > cutoff
    );
  }

  private calculateCacheHitRate(requests: RequestTracker[]): number {
    const cached = requests.filter(req => 
      req.metadata?.cached === true
    ).length;
    return requests.length > 0 ? (cached / requests.length) * 100 : 0;
  }

  private calculateDbQueryTime(requests: RequestTracker[]): number {
    const dbRequests = requests.filter(req => 
      req.endpoint.includes('db') || req.metadata?.type === 'database'
    );
    
    if (dbRequests.length === 0) return 0;
    
    const totalTime = dbRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0);
    return totalTime / dbRequests.length;
  }

  private calculateHourlyDistribution(requests: RequestTracker[]): Array<{
    hour: string;
    requests: number;
    errors: number;
    averageTime: number;
  }> {
    // Simplified hourly distribution - would be more sophisticated in production
    const now = new Date();
    const hours = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toISOString().substr(11, 2) + ':00';
      
      hours.push({
        hour: hourStr,
        requests: Math.floor(Math.random() * 100), // Placeholder
        errors: Math.floor(Math.random() * 10),
        averageTime: Math.random() * 1000
      });
    }
    
    return hours;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const performanceMonitor = new PerformanceMonitor();